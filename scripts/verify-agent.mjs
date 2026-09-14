#!/usr/bin/env node
/**
 * Agent / terminal verification trail.
 * Requires Orbital loaded in this Cursor window (Reload after install).
 *
 * Writes .vscode/orbital-verify-request.json and polls
 * .vscode/orbital-verify-result.json until PASS/FAIL or timeout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const vscodeDir = path.join(root, '.vscode');
const requestPath = path.join(vscodeDir, 'orbital-verify-request.json');
const resultPath = path.join(vscodeDir, 'orbital-verify-result.json');

const TIMEOUT_MS = Number(process.env.ORBITAL_VERIFY_TIMEOUT_MS || 45_000);
const POLL_MS = 500;

fs.mkdirSync(vscodeDir, { recursive: true });

const requestAt = Date.now();
const request = {
  at: requestAt,
  playVisuals: process.env.ORBITAL_VERIFY_DRY === '1' ? false : true,
  probeCommit: true,
};

// Clear stale result so we don't match an old run
try {
  fs.rmSync(resultPath, { force: true });
} catch {
  /* ignore */
}

fs.writeFileSync(requestPath, JSON.stringify(request, null, 2), 'utf8');
console.log('🛸 Orbital agent verify');
console.log(`   request → ${path.relative(root, requestPath)} (at=${requestAt})`);
console.log('   waiting for extension listener (Cursor must be open on this folder)…');

const started = Date.now();

function readResult() {
  try {
    if (!fs.existsSync(resultPath)) {
      return null;
    }
    const raw = fs.readFileSync(resultPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

while (Date.now() - started < TIMEOUT_MS) {
  const result = readResult();
  if (result && result.requestAt === requestAt) {
    console.log('');
    console.log(result.summary || '(no summary)');
    console.log(`   extension v${result.version ?? '?'}`);
    console.log(`   result → ${path.relative(root, resultPath)}`);
    if (result.ok) {
      console.log('\n✓ Agent verify PASS\n');
      process.exit(0);
    }
    console.error('\n✗ Agent verify FAIL\n');
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}

console.error(`
✗ Timed out after ${TIMEOUT_MS}ms — extension did not answer.

Checklist:
  1. Orbital installed in this Cursor window (latest VSIX)
  2. Developer: Reload Window after install
  3. This folder is the open workspace root
  4. Output → Orbital should show: "Agent verify listener active"

Then re-run: npm run verify:agent
`);
process.exit(1);
