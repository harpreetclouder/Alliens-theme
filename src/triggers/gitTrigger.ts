import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

interface GitRepository {
  onDidCommit: vscode.Event<void>;
}

interface GitAPI {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
}

interface GitExtensionExports {
  getAPI(version: 1): GitAPI;
}

function wireGitRepos(
  api: GitAPI,
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
  add: (...disposables: vscode.Disposable[]) => void,
): void {
  const wireRepo = (repo: GitRepository): void => {
    add(
      repo.onDidCommit(() => {
        const settings = getSettings();
        if (!settings.triggers.commit) {
          return;
        }
        engine.handle('commit');
      }),
    );
  };

  for (const repo of api.repositories) {
    wireRepo(repo);
  }

  add(api.onDidOpenRepository(wireRepo));
}

export function registerGitTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const gitExt = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
  if (!gitExt) {
    return [];
  }

  const inner: vscode.Disposable[] = [];
  const add = (...disposables: vscode.Disposable[]): void => {
    inner.push(...disposables);
  };

  const composite = new vscode.Disposable(() => {
    for (const disposable of inner) {
      disposable.dispose();
    }
  });

  let wired = false;

  const tryWire = (): void => {
    if (wired || !gitExt.isActive) {
      return;
    }
    try {
      wireGitRepos(gitExt.exports.getAPI(1), engine, getSettings, add);
      wired = true;
    } catch {
      // Git API unavailable — skip silently.
    }
  };

  if (gitExt.isActive) {
    tryWire();
  } else {
    void gitExt.activate().then(tryWire);
  }

  return [composite];
}
