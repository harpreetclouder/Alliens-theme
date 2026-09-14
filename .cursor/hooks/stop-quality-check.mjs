#!/usr/bin/env node
/**
 * stop hook — one-shot quality nudge when product TS files changed this session.
 * Does NOT auto-loop forever (loop_limit: 1 in hooks.json).
 * Emits followup_message only if compile/test/eval look needed and marker absent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const root = process.cwd();
const marker = path.join(root, '.orbital', 'last-stop-verify.json');

function recentlyVerified() {
  try {
    const j = JSON.parse(fs.readFileSync(marker, 'utf8'));
    return Date.now() - (j.at || 0) < 5 * 60_000;
  } catch {
    return false;
  }
}

// Only nudge when status suggests dirty product sources
let dirty = false;
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  dirty = /src\/.*\.ts|package\.json|evals\//.test(status);
} catch {
  dirty = false;
}

if (!dirty || recentlyVerified()) {
  process.stdout.write(JSON.stringify({}));
  process.exit(0);
}

// Run lightweight verification once
let ok = true;
let log = '';
try {
  log += execSync('npm run compile', {
    encoding: 'utf8',
    env: { ...process.env, ORBITAL_SKIP_SIGNAL: '1' },
  });
  log += execSync('npm test', {
    encoding: 'utf8',
    env: { ...process.env, ORBITAL_SKIP_SIGNAL: '1' },
  });
  log += execSync('npm run eval', {
    encoding: 'utf8',
    env: { ...process.env, ORBITAL_SKIP_SIGNAL: '1' },
  });
} catch (err) {
  ok = false;
  log += String(err?.stdout || err?.message || err);
}

fs.mkdirSync(path.join(root, '.orbital'), { recursive: true });
fs.writeFileSync(
  marker,
  JSON.stringify({ at: Date.now(), ok }, null, 2),
  'utf8',
);

if (ok) {
  process.stdout.write(
    JSON.stringify({
      followup_message:
        'Stop quality check: compile + test + eval passed. If this was a substantial feature, invoke orbital-verifier next.',
    }),
  );
} else {
  process.stdout.write(
    JSON.stringify({
      followup_message:
        'Stop quality check FAILED (compile/test/eval). Fix failures before claiming done. See terminal output.',
    }),
  );
}
process.exit(0);
