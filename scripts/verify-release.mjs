#!/usr/bin/env node
/**
 * Full release / agent verification workflow.
 * Offline steps always run. Live steps need Cursor open with Orbital loaded.
 *
 *   npm run verify:release          # offline hard gates
 *   ORBITAL_LIVE=1 npm run verify:release   # + agent visuals + live commit
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const live = process.env.ORBITAL_LIVE === '1';

function step(label) {
  console.log(`\n▸ ${label}`);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

console.log('\n🛸 Orbital verify:release');
console.log(live ? '   mode: LIVE (agent + commit)' : '   mode: offline hard gates');

try {
  step('Compile');
  run('npm run compile');

  step('Unit tests');
  run('npm test', { env: { ...process.env, ORBITAL_SKIP_SIGNAL: '1' } });

  step('Hard commit-detect simulation');
  run('node scripts/verify-commit-detect.mjs');

  step('Orbital Brain evals');
  run('node scripts/eval.mjs');

  if (live) {
    step('Agent verify (preview + commit path)');
    run('npm run verify:agent');

    step('Live SCM-equivalent commit detect');
    run('node scripts/verify-commit-live.mjs');
  } else {
    console.log('\n  Tip: after install + Reload, run:');
    console.log('  ORBITAL_LIVE=1 npm run verify:release\n');
  }

  console.log('\n✓ verify:release PASS\n');
} catch (err) {
  console.error('\n✗ verify:release FAIL\n');
  process.exit(err?.status || 1);
}
