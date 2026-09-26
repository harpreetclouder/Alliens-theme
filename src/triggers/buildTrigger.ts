import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

const BUILD_NAME_RE = /build|compile|webpack|vite build|tsc/i;
const BUILD_CMD_RE =
  /\b(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:build|compile)\b|\btsc\b|\bvite\s+build\b/i;

export function registerBuildTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [
    vscode.tasks.onDidEndTaskProcess((e) => {
      const settings = getSettings();
      if (!settings.triggers.build) {
        return;
      }
      if (e.exitCode !== 0) {
        return;
      }

      const name = e.execution.task.name;
      if (!BUILD_NAME_RE.test(name)) {
        return;
      }

      engine.handle('build');
    }),
  ];

  try {
    const win = vscode.window as typeof vscode.window & {
      onDidEndTerminalShellExecution?: vscode.Event<{
        exitCode?: number;
        execution?: { commandLine?: { value?: string } };
      }>;
    };
    const onEnd = win.onDidEndTerminalShellExecution;
    if (typeof onEnd === 'function') {
      disposables.push(
        onEnd((event) => {
          const settings = getSettings();
          if (!settings.triggers.build || event.exitCode !== 0) {
            return;
          }
          const cmd = event.execution?.commandLine?.value ?? '';
          if (BUILD_CMD_RE.test(cmd)) {
            engine.handle('build');
          }
        }),
      );
    }
  } catch {
    /* proposed terminal API may throw on access */
  }

  return disposables;
}
