#!/usr/bin/env node
/**
 * Opens a standalone Chromium window with StepFlow already loaded —
 * no "Developer mode", no corporate Chrome policies, no impact on your
 * regular browser profile.
 *
 *   npm run chromium            keeps state in .chromium-profile/
 *   npm run chromium -- --fresh starts from a clean profile every time
 *
 * Set CHROMIUM_PATH to use your own Chromium / Chrome for Testing binary.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, launchWithExtension } from '../tests/e2e/harness.mjs';

const fresh = process.argv.includes('--fresh');
const profile = join(REPO_ROOT, '.chromium-profile');
if (fresh) rmSync(profile, { recursive: true, force: true });

const { context, extensionId } = await launchWithExtension({
  headless: false,
  userDataDir: fresh ? '' : profile,
  locale: process.env.LOCALE || 'ru-RU',
});

const [first] = context.pages();
const start = first ?? (await context.newPage());
await start.goto('https://example.com').catch(() => {});

console.log(`StepFlow loaded (id ${extensionId}).`);
console.log('• Click the puzzle icon → pin StepFlow → click it to open the popup.');
console.log(`• Popup as a tab:      chrome-extension://${extensionId}/src/popup/popup.html`);
console.log(`• Side panel as a tab: chrome-extension://${extensionId}/src/sidepanel/sidepanel.html`);
console.log('Close the browser window to exit.');

context.on('close', () => process.exit(0));
