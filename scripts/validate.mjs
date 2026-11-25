#!/usr/bin/env node
/**
 * Static checks for the extension package. No dependencies.
 *   node scripts/validate.mjs
 *
 * - manifest is MV3 and contains no remote/legacy keys
 * - every permission is on the explicit allowlist (with a reason)
 * - every file referenced by the manifest exists
 * - every __MSG_*__ / data-i18n key exists in every locale
 * - all locales define the same set of keys
 * - relative imports / stylesheet / script paths resolve
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);
const read = (p) => readFileSync(join(root, p), 'utf8');

/** Permissions we intentionally request, and why. Adding one = updating this list + README. */
const ALLOWED_PERMISSIONS = {
  sidePanel: 'Show the StepFlow side panel',
  storage: 'Persist settings and guides locally (chrome.storage.local)',
  activeTab: 'Temporarily access the active tab after the user invokes StepFlow',
  scripting: 'Inject the recorder into the user-authorized active tab',
};

const manifest = JSON.parse(read('manifest.json'));

// ---- MV3 basics -------------------------------------------------------------
if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
for (const key of ['browser_action', 'page_action', 'web_accessible_resources_v2']) {
  if (key in manifest) fail(`Legacy/unsupported key "${key}" in manifest`);
}
if (manifest.background?.scripts || manifest.background?.persistent !== undefined) {
  fail('MV3 requires background.service_worker, not scripts/persistent');
}
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) fail(`Invalid version "${manifest.version}"`);

// ---- Permissions ------------------------------------------------------------
for (const p of manifest.permissions || []) {
  if (!(p in ALLOWED_PERMISSIONS)) fail(`Permission "${p}" is not on the allowlist`);
}
for (const key of ['host_permissions', 'optional_host_permissions', 'content_scripts']) {
  if (manifest[key]?.length) fail(`"${key}" is not expected at this stage`);
}
if (manifest.content_security_policy) fail('Custom CSP is not expected — keep the MV3 default');

// ---- Referenced files ------------------------------------------------------
const referenced = [
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
  manifest.action?.default_popup,
  manifest.side_panel?.default_path,
  manifest.background?.service_worker,
].filter(Boolean);
for (const file of referenced) {
  if (!existsSync(join(root, file))) fail(`Manifest references missing file: ${file}`);
}

// ---- Locales ---------------------------------------------------------------
const locales = readdirSync(join(root, '_locales'));
const localeKeys = Object.fromEntries(
  locales.map((l) => [l, new Set(Object.keys(JSON.parse(read(`_locales/${l}/messages.json`))))]),
);
if (!locales.includes(manifest.default_locale)) fail(`default_locale "${manifest.default_locale}" has no _locales folder`);
const base = localeKeys[manifest.default_locale] || new Set();
for (const [locale, keys] of Object.entries(localeKeys)) {
  for (const k of base) if (!keys.has(k)) fail(`Locale "${locale}" is missing key "${k}"`);
  for (const k of keys) if (!base.has(k)) fail(`Locale "${locale}" has extra key "${k}"`);
}
const usedKeys = new Set();
for (const m of JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)) usedKeys.add(m[1]);

// ---- Walk source files -----------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    for (const m of text.matchAll(/data-i18n(?:-[\w-]+)?="([\w]+)"/g)) usedKeys.add(m[1]);
    for (const m of text.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
      if (!existsSync(resolve(dirname(file), m[1]))) fail(`${rel}: missing asset "${m[1]}"`);
    }
    if (/<script(?![^>]*\bsrc=)[^>]*>/.test(text)) fail(`${rel}: inline <script> is blocked by MV3 CSP`);
    if (/\son[a-z]+="/.test(text)) fail(`${rel}: inline event handler is blocked by MV3 CSP`);
    if (/(?:src|href)="(?:https?:)?\/\//.test(text)) fail(`${rel}: remote resources are not allowed`);
  }
  if (file.endsWith('.js')) {
    for (const m of text.matchAll(/(?:import|from)\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      if (!existsSync(resolve(dirname(file), m[1]))) fail(`${rel}: unresolved import "${m[1]}"`);
    }
    for (const m of text.matchAll(/\bt\('(\w+)'\)/g)) usedKeys.add(m[1]);
    if (/\beval\(|new Function\(/.test(text)) fail(`${rel}: eval/new Function is not allowed in MV3`);
  }
}
for (const k of usedKeys) if (!base.has(k)) fail(`i18n key "${k}" is used but not defined`);
if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ manifest v${manifest.version} OK`);
console.log(`  permissions: ${(manifest.permissions || []).map((p) => `${p} (${ALLOWED_PERMISSIONS[p]})`).join(', ')}`);
console.log(`  locales: ${locales.join(', ')} · ${base.size} keys · ${usedKeys.size} used`);
