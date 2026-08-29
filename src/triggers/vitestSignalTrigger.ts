import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';

const SIGNAL_REL = '.vscode/orbital-test-pass.json';
const STREAK_REL = '.vscode/orbital-streak.json';
const POLL_MS = 800;

async function readStreak(folder: vscode.WorkspaceFolder): Promise<number> {
  const uri = vscode.Uri.joinPath(folder.uri, STREAK_REL);
  try {
    const raw = await vscode.workspace.fs.readFile(uri);
    const parsed = JSON.parse(Buffer.from(raw).toString('utf8')) as {
      count?: number;
      day?: string;
    };
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.day === today && typeof parsed.count === 'number') {
      return parsed.count;
    }
  } catch {
    /* no streak file yet */
  }
  return 0;
}

export function registerVitestSignalTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable {
  const disposables: vscode.Disposable[] = [];
  let lastSeenAt = 0;

  const fire = async (source: string, folder: vscode.WorkspaceFolder): Promise<void> => {
    const settings = getSettings();
    if (!settings.triggers.tests) {
      orbitalLog('Test signal ignored', 'test trigger disabled in settings');
      return;
    }
    const streak = await readStreak(folder);
    orbitalLog('Test win detected', `${source} → celebration · streak ${streak}`);
    engine.handle('tests', {
      returnFocus: 'terminal',
      terminalNative: true,
      streak,
    });
  };

  const readSignal = async (): Promise<void> => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return;
    }

    const uri = vscode.Uri.joinPath(folder.uri, SIGNAL_REL);
    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      const parsed = JSON.parse(Buffer.from(raw).toString('utf8')) as { at?: number };
      const at = typeof parsed.at === 'number' ? parsed.at : 0;
      if (at > lastSeenAt) {
        lastSeenAt = at;
        await fire('npm posttest signal', folder);
      }
    } catch {
      /* file not written yet */
    }
  };

  const watcher = vscode.workspace.createFileSystemWatcher(`**/${SIGNAL_REL}`);
  watcher.onDidCreate(() => void readSignal());
  watcher.onDidChange(() => void readSignal());
  disposables.push(watcher);

  const poll = setInterval(() => void readSignal(), POLL_MS);
  disposables.push({ dispose: () => clearInterval(poll) });

  void readSignal();

  orbitalLog('Test signal listener active', `${SIGNAL_REL} (watcher + poll)`);

  return vscode.Disposable.from(...disposables);
}
