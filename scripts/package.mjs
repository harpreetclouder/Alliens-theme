#!/usr/bin/env node
/**
 * Orbital — build & package with hard verification gates.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(root, '..'));

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const vsixName = `orbital-${pkg.version}.vsix`;

function step(n, total, label) {
  console.log(`\n▸ Step ${n}/${total}  ${label}`);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

console.log('\n🛸 Orbital — build & package');
console.log(`   version ${pkg.version}`);

try {
  step(1, 5, 'Compiling TypeScript (npm run compile)');
  run('npm run compile');

  step(2, 5, 'Unit tests (npm test)');
  run('npm test', { env: { ...process.env, ORBITAL_SKIP_SIGNAL: '1' } });

  step(3, 5, 'Orbital Brain evals + hard commit-detect');
  run('node scripts/eval.mjs');
  run('node scripts/verify-commit-detect.mjs');

  step(4, 5, 'Bundling VSIX (vsce package)');
  run(
    'npx vsce package --allow-missing-repository --no-rewrite-relative-links --no-dependencies --allow-package-all-secrets --allow-package-env-file --baseContentUrl https://github.com/orbital-theme/orbital --baseImagesUrl https://github.com/orbital-theme/orbital',
  );

  step(5, 5, 'Verifying output');
  if (!fs.existsSync(vsixName)) {
    console.error(`\n✗ Expected ${vsixName} was not created.`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join('media', 'webview', 'scene.bundle.js'))) {
    console.error('\n✗ Missing media/webview/scene.bundle.js — run npm run build:scene');
    process.exit(1);
  }

  const mb = (fs.statSync(vsixName).size / (1024 * 1024)).toFixed(2);
  const abs = path.resolve(vsixName);

  console.log('\n✓ Package ready');
  console.log(`  File:   ${vsixName} (${mb} MB)`);
  console.log(`  Path:   ${abs}`);
  const cursorCli =
    process.platform === 'darwin'
      ? '/Applications/Cursor.app/Contents/Resources/app/bin/cursor'
      : 'cursor';

  console.log('\n  Install in Cursor:');
  console.log(`  "${cursorCli}" --install-extension "${abs}" --force`);
  console.log('\n  Then: Developer → Reload Window');
  console.log('  Then: ORBITAL_LIVE=1 npm run verify:release');
  console.log('        (agent visuals + real allow-empty commit detect)\n');
} catch (err) {
  console.error('\n✗ Package failed — see errors above.');
  if (err?.status) {
    process.exit(err.status);
  }
  process.exit(1);
}
