import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';
import { isCommitOperationKind } from './gitCommitDetect';

export { isCommitOperationKind } from './gitCommitDetect';
interface GitOperationEvent {
  readonly operation?: { readonly kind?: string };
  readonly error?: unknown;
}

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: {
    readonly HEAD?: { readonly commit?: string };
    readonly onDidChange?: vscode.Event<void>;
  };
  readonly onDidCommit?: vscode.Event<void>;
  readonly onDidRunOperation?: vscode.Event<GitOperationEvent>;
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
const DEDUPE_MS = 4000;

/**
 * Wire SCM commit celebrations with Cursor-friendly fallbacks:
 * 1) onDidRunOperation (Commit) — most reliable on Cursor
 * 2) onDidCommit — classic VS Code
 * Dedupe by HEAD sha within a short window so dual listeners don't double-fire.
 */
export function registerGitTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const wiredRoots = new Set<string>();
  let apiListenersAttached = false;
  let enablementListenerAttached = false;
  let lastCelebratedSha = '';
  let lastCelebratedAt = 0;

  const celebrateCommit = (source: string, sha?: string): void => {
    const settings = getSettings();
    if (!settings.triggers.commit) {
      orbitalLog('Commit ignored', 'commit trigger disabled in settings');
      return;
    }

    const now = Date.now();
    if (sha && sha === lastCelebratedSha && now - lastCelebratedAt < DEDUPE_MS) {
      orbitalLog('Commit ignored', `deduped · ${sha.slice(0, 7)}`);
      return;
    }
    if (!sha && now - lastCelebratedAt < DEDUPE_MS) {
      orbitalLog('Commit ignored', 'deduped · recent fire');
      return;
    }

    lastCelebratedSha = sha || lastCelebratedSha;
    lastCelebratedAt = now;
    orbitalLog('Commit win detected', source);
    engine.handle('commit');
  };

  const wireRepo = (repo: GitRepository): void => {
    const key = repo.rootUri.toString();
    if (wiredRoots.has(key)) {
      return;
    }
    wiredRoots.add(key);

    let hooks = 0;

    if (typeof repo.onDidRunOperation === 'function') {
      disposables.push(
        repo.onDidRunOperation((ev) => {
          if (ev?.error) {
            return;
          }
          if (!isCommitOperationKind(ev?.operation?.kind)) {
            return;
          }
          const sha = repo.state.HEAD?.commit;
          celebrateCommit(`onDidRunOperation · ${ev?.operation?.kind} · ${key}`, sha);
        }),
      );
      hooks += 1;
    }

    if (typeof repo.onDidCommit === 'function') {
      disposables.push(
        repo.onDidCommit(() => {
          const sha = repo.state.HEAD?.commit;
          celebrateCommit(`onDidCommit · ${key}`, sha);
        }),
      );
      hooks += 1;
    }

    if (hooks === 0) {
      orbitalLog(
        'Git repo has no commit events',
        `${key} — Cursor git API may differ; use Orbital: Verify Celebrations`,
      );
    } else {
      orbitalLog('Git repo wired', `${key} · hooks=${hooks}`);
    }
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
        `${api.repositories.length} repo(s) · onDidRunOperation+onDidCommit`,
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
