#!/usr/bin/env node
/** After successful npm test — in-terminal celebration + extension signal. */
import fs from 'node:fs';
import path from 'node:path';
import { celebrate } from './terminal-celebration.mjs';
import { bumpStreak } from './streak.mjs';

if (process.env.ORBITAL_SKIP_SIGNAL === '1') {
  process.exit(0);
}

const streak = bumpStreak();
await celebrate({ streak });

const vscodeDir = path.join(process.cwd(), '.vscode');
fs.mkdirSync(vscodeDir, { recursive: true });

const signalPath = path.join(vscodeDir, 'orbital-test-pass.json');
fs.writeFileSync(
  signalPath,
  JSON.stringify({ at: Date.now(), source: 'npm-posttest', terminal: true, streak }),
  'utf8',
);

const legacy = path.join(process.cwd(), '.orbital', 'test-pass.json');
try {
  fs.rmSync(legacy, { force: true });
} catch {
  /* ignore */
}
