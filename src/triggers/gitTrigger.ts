import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: { readonly HEAD?: { commit?: string } };
  readonly onDidCommit: vscode.Event<void>;
}

interface GitAPI {
  readonly state: 'uninitialized' | 'initialized';
  readonly repositories: GitRepository[];
  readonly onDidOpenRepository: vscode.Event<GitRepository>;
  readonly onDidChangeState: vscode.Event<'uninitialized' | 'initialized'>;
}

interface GitExtension {
  readonly enabled: boolean;
  readonly onDidChangeEnablement: vscode.Event<boolean>;
  getAPI(version: 1): GitAPI;
}

const RETRY_MS = [500, 2000, 5000];

export function registerGitTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const wiredRoots = new Set<string>();
  let apiListenersAttached = false;
  let enablementListenerAttached = false;

  const celebrateCommit = (source: string): void => {
    const settings = getSettings();
    if (!settings.triggers.commit) {
      orbitalLog('Commit ignored', 'commit trigger disabled in settings');
      return;
    }
    orbitalLog('Commit win detected', source);
    engine.handle('commit');
  };

  const wireRepo = (repo: GitRepository): void => {
    const key = repo.rootUri.toString();
    if (wiredRoots.has(key)) {
      return;
    }
    wiredRoots.add(key);

    disposables.push(
      repo.onDidCommit(() => celebrateCommit(`onDidCommit · ${key}`)),
    );
    orbitalLog('Git repo wired', key);
  };

  const wireAllRepos = (api: GitAPI): void => {
    for (const repo of api.repositories) {
      wireRepo(repo);
    }
  };

  const attachApiListeners = (api: GitAPI): void => {
    if (!apiListenersAttached) {
      apiListenersAttached = true;
      disposables.push(api.onDidOpenRepository((repo) => wireRepo(repo)));
      disposables.push(
        api.onDidChangeState((state) => {
          if (state === 'initialized') {
            wireAllRepos(api);
          }
        }),
      );

      for (const ms of RETRY_MS) {
        const timer = setTimeout(() => wireAllRepos(api), ms);
        disposables.push({ dispose: () => clearTimeout(timer) });
      }
    }
    wireAllRepos(api);
  };

  const tryWireGitApi = (git: GitExtension): void => {
    if (!git.enabled) {
      orbitalLog('Git extension disabled', 'commit trigger waiting');
      return;
    }
    try {
      const api = git.getAPI(1);
      attachApiListeners(api);
      orbitalLog(
        'Git commit listener active',
        `${api.repositories.length} repo(s) wired · onDidCommit`,
      );
    } catch (err) {
      orbitalLog('Git API unavailable', String(err));
    }
  };

  const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExt) {
    orbitalLog('Git extension not found', 'commit celebrations unavailable');
    return disposables;
  }

  const activateGit = (): void => {
    tryWireGitApi(gitExt.exports);

    if (!enablementListenerAttached) {
      enablementListenerAttached = true;
      disposables.push(
        gitExt.exports.onDidChangeEnablement((enabled) => {
          if (enabled) {
            tryWireGitApi(gitExt.exports);
          }
        }),
      );
    }
  };

  if (gitExt.isActive) {
    activateGit();
  } else {
    void gitExt.activate().then(activateGit);
  }

  return disposables;
}
