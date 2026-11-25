#!/usr/bin/env node
/**
 * Copies only the files the extension needs into dist/stepflow/.
 * Use it to hand a clean build to a tester or another computer:
 * zip the folder, unzip there, then "Load unpacked" → dist/stepflow.
 *
 *   npm run pack
 */
import { cpSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const INCLUDE = ['manifest.json', '_locales', 'assets', 'src', 'LICENSE'];
const out = join(root, 'dist', 'stepflow');

rmSync(join(root, 'dist'), { recursive: true, force: true });
for (const entry of INCLUDE) cpSync(join(root, entry), join(out, entry), { recursive: true });

const { version } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
console.log(`✓ StepFlow v${version} → ${out}`);
