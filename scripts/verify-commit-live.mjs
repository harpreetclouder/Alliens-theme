#!/usr/bin/env node
/**
 * LIVE commit detection: real `git commit --allow-empty` in this workspace,
 * then wait for extension to write .vscode/orbital-commit-detected.json.
 * Requires Orbital loaded (Reload after install).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const vscodeDir = path.join(root, '.vscode');
const detectedPath = path.join(vscodeDir, 'orbital-commit-detected.json');
const TIMEOUT_MS = Number(process.env.ORBITAL_COMMIT_TIMEOUT_MS || 20_000);
const POLL_MS = 250;

fs.mkdirSync(vscodeDir, { recursive: true });
try {
  fs.rmSync(detectedPath, { force: true });
} catch {
  /* ignore */
}

console.log('🛸 Orbital live commit verification');
console.log('   making allow-empty commit…');

execSync('git commit --allow-empty -m "orbital-verify: live commit detect"', {
  stdio: 'inherit',
});
const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
console.log(`   HEAD=${sha.slice(0, 12)}`);
console.log('   waiting for extension signal (.vscode/orbital-commit-detected.json)…');

const started = Date.now();
while (Date.now() - started < TIMEOUT_MS) {
  try {
    if (fs.existsSync(detectedPath)) {
      const raw = JSON.parse(fs.readFileSync(detectedPath, 'utf8'));
      if (raw.sha === sha || (typeof raw.sha === 'string' && sha.startsWith(raw.sha))) {
        console.log('');
        console.log(`✓ Live commit detect PASS`);
        console.log(`   source: ${raw.source}`);
        console.log(`   version: ${raw.version}`);
        console.log(`   latency: ${Date.now() - started}ms`);
        process.exit(0);
      }
    }
  } catch {
    /* ignore partial writes */
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}

console.error(`
✗ Live commit detect TIMEOUT (${TIMEOUT_MS}ms)

Extension did not report SHA ${sha.slice(0, 12)}.
Checklist:
  1. Orbital latest VSIX installed + Reload Window
  2. Output → Orbital shows "Reflog fast path"
  3. celebrations.triggers.commit = true

Then: npm run verify:commit-live
`);
process.exit(1);
