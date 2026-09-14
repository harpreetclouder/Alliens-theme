#!/usr/bin/env node
/**
 * beforeShellExecution — block destructive git + publish from the agent.
 * Fail closed. Allow normal build/test/package.
 */
import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const command = String(input.command ?? '');

const blocked = [
  { re: /git\s+push\s+[^\n]*--force/, msg: 'Blocked: git push --force' },
  { re: /git\s+push\s+-f\b/, msg: 'Blocked: git push -f' },
  { re: /git\s+reset\s+--hard/, msg: 'Blocked: git reset --hard' },
  { re: /\brm\s+(-[^\s]*\s+)*-r[^\s]*\s+(\/|\~|\$HOME|\.\.\/)/, msg: 'Blocked: recursive rm against broad paths' },
  { re: /\brm\s+-rf\s+\/\b/, msg: 'Blocked: rm -rf /' },
  { re: /\bnpm\s+publish\b/, msg: 'Blocked: npm publish (human only)' },
  { re: /\bvsce\s+publish\b/, msg: 'Blocked: vsce publish (human only)' },
  { re: /\bovsx\s+publish\b/, msg: 'Blocked: ovsx publish (human only)' },
];

for (const b of blocked) {
  if (b.re.test(command)) {
    process.stdout.write(
      JSON.stringify({
        permission: 'deny',
        user_message: b.msg,
        agent_message: `${b.msg}. Ask the human to run publish/destructive git intentionally.`,
      }),
    );
    process.exit(0);
  }
}

process.stdout.write(JSON.stringify({ permission: 'allow' }));
