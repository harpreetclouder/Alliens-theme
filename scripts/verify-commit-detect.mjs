#!/usr/bin/env node
/**
 * HARD offline commit-detection simulation (no Cursor UI required).
 * Creates a temp git repo, commits / amends / checkouts, asserts reflog parser
 * only fires on real commits. Runs automatically before every package.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Compiled JS after compile step; fall back to ts via vitest path is package-only.
const detectPath = path.join(root, 'out', 'triggers', 'gitCommitDetect.js');
const reflogPath = path.join(root, 'out', 'triggers', 'gitReflog.js');

if (!fs.existsSync(detectPath) || !fs.existsSync(reflogPath)) {
  console.error('✗ Run npm run compile first (missing out/triggers/*.js)');
  process.exit(1);
}

const { parseCommitShaFromReflogLine } = require(detectPath);
const { readLatestCommitShaFromReflog, resolveHeadReflogPath } = require(reflogPath);

function git(cwd, args) {
  return execSync(`git ${args}`, { cwd, encoding: 'utf8' }).trim();
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

console.log('🛸 Orbital hard commit-detect simulation');

const tmp = path.join(root, '.tmp-commit-sim');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
try {
  git(tmp, 'init');
  git(tmp, 'config user.email "orbital@test.local"');
  git(tmp, 'config user.name "Orbital Sim"');

  fs.writeFileSync(path.join(tmp, 'a.txt'), 'one\n');
  git(tmp, 'add a.txt');
  git(tmp, 'commit -m "first"');
  const sha1 = git(tmp, 'rev-parse HEAD');

  assert(resolveHeadReflogPath(tmp), 'reflog path missing');
  assert(readLatestCommitShaFromReflog(tmp) === sha1, `expected sha1 ${sha1}`);

  fs.writeFileSync(path.join(tmp, 'a.txt'), 'two\n');
  git(tmp, 'add a.txt');
  git(tmp, 'commit -m "second"');
  const sha2 = git(tmp, 'rev-parse HEAD');
  assert(readLatestCommitShaFromReflog(tmp) === sha2, `expected sha2 ${sha2}`);

  git(tmp, 'commit --amend -m "second-amended"');
  const shaAmend = git(tmp, 'rev-parse HEAD');
  assert(readLatestCommitShaFromReflog(tmp) === shaAmend, `expected amend ${shaAmend}`);

  git(tmp, 'checkout -b other');
  const afterCheckout = readLatestCommitShaFromReflog(tmp);
  assert(
    afterCheckout === undefined,
    `checkout must not look like commit (got ${afterCheckout})`,
  );

  const old = 'b'.repeat(40);
  const neu = 'a'.repeat(40);
  assert(
    parseCommitShaFromReflogLine(`${old} ${neu} A <a@b.c> 1 +0000\tcommit: x`) === neu,
    'parser commit',
  );
  assert(
    parseCommitShaFromReflogLine(
      `${old} ${neu} A <a@b.c> 1 +0000\tcheckout: moving from main to other`,
    ) === undefined,
    'parser checkout',
  );

  console.log('✓ Hard commit-detect PASS');
  console.log(`   tmp=${tmp}`);
  console.log(`   commits: ${sha1.slice(0, 7)} → ${sha2.slice(0, 7)} → ${shaAmend.slice(0, 7)}`);
} catch (err) {
  console.error('✗ Hard commit-detect FAIL');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}
