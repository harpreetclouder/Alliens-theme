#!/usr/bin/env node
/**
 * Orbital Brain scenario evals — deterministic, no LLM judging.
 * Usage: npm run eval
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const runnerPath = path.join(root, 'out', 'brain', 'evalRunner.js');

if (!fs.existsSync(runnerPath)) {
  console.error('✗ Missing out/brain — run npm run compile first');
  process.exit(1);
}

const { runScenario, decisionAt } = require(runnerPath);
const dir = path.join(root, 'evals', 'scenarios');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

let failed = 0;
console.log('🛸 Orbital eval\n');

for (const file of files.sort()) {
  const scenario = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const result = runScenario(scenario);

  if (scenario.assertTypingStep) {
    const mid = decisionAt(scenario, scenario.assertTypingStep.afterIndex);
    for (const f of scenario.assertTypingStep.forbiddenIncludes ?? []) {
      if (!mid.forbidden.includes(f)) {
        result.failures.push(`typing step: forbidden missing ${f}`);
        result.pass = false;
      }
    }
    if (mid.outcome === 'overlay' || mid.outcome === 'intermission') {
      result.failures.push(`typing step: outcome=${mid.outcome} not allowed`);
      result.pass = false;
    }
  }

  const mark = result.pass ? '✓' : '✗';
  console.log(`${mark} ${result.id}`);
  console.log(`  decision: ${result.decision.outcome}`);
  console.log(`  expected: ${JSON.stringify(result.expected)}`);
  console.log(`  trace: ${result.decision.trace.join(' · ') || '(none)'}`);
  if (!result.pass) {
    failed += 1;
    for (const f of result.failures) console.log(`  FAIL: ${f}`);
  }
  console.log('');
}

if (failed) {
  console.error(`✗ ${failed}/${files.length} scenarios failed`);
  process.exit(1);
}
console.log(`✓ ${files.length}/${files.length} scenarios passed`);

const themeRunnerPath = path.join(root, 'out', 'theme', 'evalRunner.js');
const themeDir = path.join(root, 'evals', 'theme');
if (!fs.existsSync(themeRunnerPath)) {
  console.error('✗ Missing out/theme — run npm run compile first');
  process.exit(1);
}
const { runThemeScenario } = require(themeRunnerPath);
const themeFiles = fs.readdirSync(themeDir).filter((f) => f.endsWith('.json')).sort();
let themeFailed = 0;
console.log('\n🎨 Theme harness\n');
for (const file of themeFiles) {
  const scenario = JSON.parse(fs.readFileSync(path.join(themeDir, file), 'utf8'));
  const result = runThemeScenario(scenario);
  const mark = result.pass ? '✓' : '✗';
  console.log(`${mark} ${result.id}  theme=${result.frame.colorTheme} tint=${Object.keys(result.frame.colorCustomizations).length > 0}`);
  if (!result.pass) {
    themeFailed += 1;
    for (const f of result.failures) console.log(`  FAIL: ${f}`);
  }
}
if (themeFailed) {
  console.error(`\n✗ ${themeFailed}/${themeFiles.length} theme scenarios failed`);
  process.exit(1);
}
console.log(`\n✓ ${themeFiles.length}/${themeFiles.length} theme scenarios passed`);
