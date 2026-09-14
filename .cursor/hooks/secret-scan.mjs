#!/usr/bin/env node
/**
 * afterFileEdit-style lightweight secret scan helper — also usable standalone.
 * Hook entry for stop uses stop-quality-check; this scans staged/changed content paths via env.
 */
import fs from 'node:fs';
import path from 'node:path';

const PATTERNS = [
  { re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/, label: 'private key' },
  { re: /ghp_[A-Za-z0-9]{20,}/, label: 'GitHub token' },
  { re: /github_pat_[A-Za-z0-9_]{20,}/, label: 'GitHub pat' },
  { re: /sk-[A-Za-z0-9]{20,}/, label: 'sk- API key shape' },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
];

const SKIP = new Set(['node_modules', 'out', '.git', 'media', '*.vsix']);

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name) || e.name.endsWith('.vsix')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs|json|md|env)$/i.test(e.name) && !e.name.includes('package-lock')) {
      out.push(p);
    }
  }
  return out;
}

const root = process.cwd();
const files = walk(root).slice(0, 400);
const hits = [];
for (const f of files) {
  let text;
  try {
    text = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  if (text.length > 500_000) continue;
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      hits.push({ file: path.relative(root, f), label: p.label });
      break;
    }
  }
}

if (hits.length) {
  console.error('Secret-like patterns found:');
  for (const h of hits) console.error(`  - ${h.file}: ${h.label}`);
  process.exit(1);
}
console.log('secret-scan: clean');
