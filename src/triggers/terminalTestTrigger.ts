import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { CELEBRATION_DURATION_MS, EXIT_LEAD_MS } from '../celebrations/durations';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog, orbitalLogSkip } from '../util/log';

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

type ShellEndEvent = {
  exitCode?: number;
  terminal?: vscode.Terminal;
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

/** Prevent double-fire from output + shell-end on the same run. */
const TERMINAL_COOLDOWN_MS = CELEBRATION_DURATION_MS.overlay + EXIT_LEAD_MS + 250;
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
      orbitalLogSkip('test trigger disabled in settings', source);
      return;
    }

    const now = Date.now();
    if (now - lastCelebrateAt < TERMINAL_COOLDOWN_MS) {
      const waitSec = Math.ceil((TERMINAL_COOLDOWN_MS - (now - lastCelebrateAt)) / 1000);
      orbitalLogSkip(`cooldown (${waitSec}s left — same run may have fired twice)`, source);
      return;
    }

    lastCelebrateAt = now;
    orbitalLog('Test win detected', `${source} → ${settings.display} celebration`);
    engine.handle('tests', { fullSuite, returnFocus: 'terminal', terminalNative: true });
  };

  const looksLikePassOutput = (text: string): boolean => {
    const tail = text.slice(-4000);
    if (!PASS_SNIPPETS.some((re) => re.test(tail))) {
      return false;
    }
    const recent = tail.slice(-1200);
    // Avoid false blocks from vitest's "N passed (M)" lines or paths containing "failed"
    if (/Tests?\s+\d+\s+failed/i.test(recent)) {
      return false;
    }
    if (/\bFAIL\b/.test(recent) || /✗|×/.test(recent)) {
      return false;
    }
    return true;
  };

  // Cursor throws on *access* to some proposed terminal APIs for 3rd-party
  // extensions — never let that kill activation (git + agent verify must load).
  try {
    const onEnd = win.onDidEndTerminalShellExecution;
    if (typeof onEnd === 'function') {
      disposables.push(
        onEnd((event) => {
          if (event.exitCode !== 0) {
            return;
          }

          const cmd = event.execution?.commandLine?.value ?? '';
          if (!TEST_CMD_RE.test(cmd)) {
            return;
          }

          celebrate(`shell exit 0 · ${cmd}`, FULL_SUITE_RE.test(cmd));
        }),
      );
    }
  } catch (err) {
    orbitalLog('Terminal shell-end API blocked', String(err));
  }

  try {
    const onData = win.onDidWriteTerminalData;
    if (typeof onData === 'function') {
      disposables.push(
        onData((event) => {
          let buf = (buffers.get(event.terminal) ?? '') + event.data;
          if (buf.length > MAX_BUFFER) {
            buf = buf.slice(-MAX_BUFFER);
          }
          buffers.set(event.terminal, buf);

          if (looksLikePassOutput(buf)) {
            celebrate('vitest/npm output in terminal', FULL_SUITE_RE.test(buf));
          }
        }),
      );
    }
  } catch (err) {
    orbitalLog('Terminal data API blocked', String(err));
  }

  if (disposables.length === 0) {
    orbitalLog(
      'Terminal shell-integration API unavailable',
      'use npm test (posttest signal) or Orbital: Preview Celebration',
    );
  } else {
    orbitalLog('Terminal test listener registered', `${disposables.length} hook(s)`);
  }

  return disposables;
}
