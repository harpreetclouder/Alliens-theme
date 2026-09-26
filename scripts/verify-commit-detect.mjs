#!/usr/bin/env node
/**
 * HARD offline commit-detection simulation (no Cursor UI required).
 * Writes a fake .git/logs/HEAD tree and asserts reflog parser behavior.
 * Runs automatically before every package.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const detectPath = path.join(root, 'out', 'triggers', 'gitCommitDetect.js');
const reflogModPath = path.join(root, 'out', 'triggers', 'gitReflog.js');

if (!fs.existsSync(detectPath) || !fs.existsSync(reflogModPath)) {
  console.error('✗ Run npm run compile first (missing out/triggers/*.js)');
  process.exit(1);
}

const { parseCommitShaFromReflogLine } = require(detectPath);
const { readLatestCommitShaFromReflog, resolveHeadReflogPath } = require(reflogModPath);

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

function reflogLine(oldSha, newSha, msg) {
  return `${oldSha} ${newSha} Orbital Sim <orbital@test.local> 1 +0000\t${msg}`;
}

console.log('🛸 Orbital hard commit-detect simulation');

const tmp = path.join(root, '.tmp-commit-sim');
fs.rmSync(tmp, { recursive: true, force: true });
const logsDir = path.join(tmp, '.git', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

try {
  const sha1 = 'a'.repeat(40);
  const sha2 = 'b'.repeat(40);
  const sha3 = 'c'.repeat(40);
  const zero = '0'.repeat(40);

  const headLog = path.join(logsDir, 'HEAD');
  fs.writeFileSync(
    headLog,
    [
      reflogLine(zero, sha1, 'commit: first'),
      reflogLine(sha1, sha2, 'commit: second'),
    ].join('\n') + '\n',
    'utf8',
  );

  assert(resolveHeadReflogPath(tmp) === headLog, 'reflog path missing');
  assert(readLatestCommitShaFromReflog(tmp) === sha2, `expected sha2 ${sha2}`);

  fs.appendFileSync(headLog, reflogLine(sha2, sha3, 'commit (amend): second-amended') + '\n');
  assert(readLatestCommitShaFromReflog(tmp) === sha3, `expected amend ${sha3}`);

  fs.appendFileSync(
    headLog,
    reflogLine(sha3, sha1, 'checkout: moving from main to other') + '\n',
  );
  assert(
    readLatestCommitShaFromReflog(tmp) === undefined,
    'checkout must not look like commit',
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
  console.log(`   commits: ${sha1.slice(0, 7)} → ${sha2.slice(0, 7)} → ${sha3.slice(0, 7)}`);
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
