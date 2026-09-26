import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';
import { isCompletedChoreCommand, isGenericCompletedTask } from './taskSignals';

type ShellEndEvent = {
  exitCode?: number;
  execution?: { commandLine?: { value?: string } };
};

/**
 * Finished chores that are not already commit, push, test, or build:
 * lint, format, typecheck, and any other successful IDE task.
 * Command text is matched locally and never stored.
 */
export function registerTaskTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [
    vscode.tasks.onDidEndTaskProcess((e) => {
      const settings = getSettings();
      if (!settings.triggers.tasks || e.exitCode !== 0) {
        return;
      }
      const name = e.execution.task.name;
      if (!isGenericCompletedTask(name)) {
        return;
      }
      orbitalLog('Task win detected', name);
      engine.handle('task');
    }),
  ];

  try {
    const win = vscode.window as typeof vscode.window & {
      onDidEndTerminalShellExecution?: vscode.Event<ShellEndEvent>;
    };
    const onEnd = win.onDidEndTerminalShellExecution;
    if (typeof onEnd === 'function') {
      disposables.push(
        onEnd((event) => {
          const settings = getSettings();
          if (!settings.triggers.tasks || event.exitCode !== 0) {
            return;
          }
          const cmd = event.execution?.commandLine?.value ?? '';
          if (!isCompletedChoreCommand(cmd)) {
            return;
          }
          orbitalLog('Task win detected', 'terminal-task');
          engine.handle('task');
        }),
      );
    }
  } catch {
    /* proposed terminal API may throw on access */
  }

  return disposables;
}
