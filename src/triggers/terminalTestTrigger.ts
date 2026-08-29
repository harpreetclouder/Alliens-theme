import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';

const TEST_CMD_RE =
  /(?:npm|pnpm|yarn)\s+(?:run\s+)?test\b|\b(?:vitest|jest|pytest|mocha|phpunit)\b|\btest\b/i;
const FULL_SUITE_RE = /suite|all|ci/i;

const PASS_SNIPPETS = [
  /Test Files\s+\d+\s+passed/i,
  /Tests\s+\d+\s+passed/i,
  /Tests:\s+\d+\s+passed/i,
  /All tests passed/i,
  /\d+\s+passed(?:,\s*\d+\s+failed)?\s*$/m,
];

const FAIL_SNIPPETS = [/Tests?\s+\d+\s+failed/i, /\bfailed\b/i, /\bFAIL\b/, /✗|×/];

type ShellEndEvent = {
  exitCode?: number;
  execution?: { commandLine?: { value?: string } };
};

type TerminalDataEvent = {
  terminal: vscode.Terminal;
  data: string;
};

type ExtendedWindow = typeof vscode.window & {
  onDidEndTerminalShellExecution?: vscode.Event<ShellEndEvent>;
  onDidWriteTerminalData?: vscode.Event<TerminalDataEvent>;
};

const TERMINAL_COOLDOWN_MS = 8000;
const MAX_BUFFER = 12_000;

export function registerTerminalTestTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const win = vscode.window as ExtendedWindow;
  let lastCelebrateAt = 0;
  const buffers = new Map<vscode.Terminal, string>();

  const celebrate = (source: string, fullSuite: boolean): void => {
    const settings = getSettings();
    if (!settings.triggers.tests) {
      return;
    }

    const now = Date.now();
    if (now - lastCelebrateAt < TERMINAL_COOLDOWN_MS) {
      orbitalLog(`Test detected (${source}) — skipped (cooldown)`);
      return;
    }

    lastCelebrateAt = now;
    orbitalLog(`Test passed (${source}) → celebrating`);
    engine.handle('tests', { fullSuite });
  };

  const looksLikePassOutput = (text: string): boolean => {
    const tail = text.slice(-4000);
    if (!PASS_SNIPPETS.some((re) => re.test(tail))) {
      return false;
    }
    const recent = tail.slice(-1200);
    return !FAIL_SNIPPETS.some((re) => re.test(recent));
  };

  if (typeof win.onDidEndTerminalShellExecution === 'function') {
    disposables.push(
      win.onDidEndTerminalShellExecution((event) => {
        if (event.exitCode !== 0) {
          return;
        }

        const cmd = event.execution?.commandLine?.value ?? '';
        if (!TEST_CMD_RE.test(cmd)) {
          return;
        }

        celebrate(`shell: ${cmd}`, FULL_SUITE_RE.test(cmd));
      }),
    );
  }

  if (typeof win.onDidWriteTerminalData === 'function') {
    disposables.push(
      win.onDidWriteTerminalData((event) => {
        let buf = (buffers.get(event.terminal) ?? '') + event.data;
        if (buf.length > MAX_BUFFER) {
          buf = buf.slice(-MAX_BUFFER);
        }
        buffers.set(event.terminal, buf);

        if (looksLikePassOutput(buf)) {
          celebrate('terminal output', FULL_SUITE_RE.test(buf));
        }
      }),
    );
  }

  if (disposables.length === 0) {
    orbitalLog(
      'Terminal test detection unavailable in this editor — use Tasks or Orbital: Preview Celebration',
    );
  }

  return disposables;
}
