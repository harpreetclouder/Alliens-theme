import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';
import {
  COMMIT_DETECTED_REL,
  type CommitDetectedFile,
} from '../verification/agentIpc';
import { isCommitOperationKind, isPushOperationKind, isStashOperationKind, isStashShellCommand, isNewStashEntry } from './gitCommitDetect';
import {
  readLatestCommitShaFromReflog,
  readLatestPushMarker,
  readLatestStashMarker,
  resolveHeadReflogPath,
} from './gitReflog';

export { isCommitOperationKind } from './gitCommitDetect';

interface GitOperationEvent {
  readonly operation?: { readonly kind?: string };
  readonly error?: unknown;
}

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: {
    readonly HEAD?: { readonly commit?: string; readonly name?: string };
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
const REFLOG_POLL_MS = 500;

/**
 * Wire SCM commit celebrations:
 * 1) Workspace-folder reflog watch/poll (fastest on Cursor — no git API lag)
 * 2) onDidCommit / onDidRunOperation when exposed
 * 3) state.onDidChange + reflog confirm
 */
export function registerGitTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
  extensionVersion = '?',
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  const wiredRoots = new Set<string>();
  const wiredReflogRoots = new Set<string>();
  let apiListenersAttached = false;
  let enablementListenerAttached = false;
  let lastCelebratedSha = '';
  let lastCelebratedAt = 0;
  let lastPushAt = 0;
  let lastStashAt = 0;

  const writeDetected = (sha: string, source: string): void => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return;
    }
    const payload: CommitDetectedFile = {
      at: Date.now(),
      sha,
      source,
      version: extensionVersion,
    };
    const uri = vscode.Uri.joinPath(folder.uri, COMMIT_DETECTED_REL);
    void vscode.workspace.fs.writeFile(
      uri,
      Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
    );
  };

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
    if (sha) {
      writeDetected(sha, source);
    }
    engine.handle('commit');
  };

  const celebratePush = (source: string, marker?: string): void => {
    const settings = getSettings();
    if (!settings.triggers.push) {
      orbitalLog('Push ignored', 'push trigger disabled in settings');
      return;
    }
    const now = Date.now();
    if (now - lastPushAt < DEDUPE_MS) {
      orbitalLog('Push ignored', 'deduped · recent push');
      return;
    }
    lastPushAt = now;
    lastCelebratedAt = now;
    orbitalLog('Push win detected', source);
    writeDetected(marker || 'push', source);
    engine.handle('push');
  };

  const celebrateStash = (source: string): void => {
    const settings = getSettings();
    if (!settings.triggers.stash) {
      orbitalLog('Stash ignored', 'stash trigger disabled in settings');
      return;
    }
    const now = Date.now();
    if (now - lastStashAt < DEDUPE_MS) {
      orbitalLog('Stash ignored', 'deduped · recent stash');
      return;
    }
    lastStashAt = now;
    orbitalLog('Stash win detected', source);
    engine.handle('stash');
  };

  const wireReflogFastPath = (repoFsPath: string, key: string): void => {
    if (wiredReflogRoots.has(repoFsPath)) {
      return;
    }
    const reflogPath = resolveHeadReflogPath(repoFsPath);
    if (!reflogPath) {
      orbitalLog('Reflog path missing', key);
      return;
    }
    wiredReflogRoots.add(repoFsPath);

    let lastReflogSha = readLatestCommitShaFromReflog(repoFsPath);
    let lastPushMarker = readLatestPushMarker(repoFsPath);
    let lastStashMarker = readLatestStashMarker(repoFsPath);
    const checkReflog = (source: string): void => {
      const sha = readLatestCommitShaFromReflog(repoFsPath);
      if (sha && sha !== lastReflogSha) {
        lastReflogSha = sha;
        celebrateCommit(`${source} · ${key}`, sha);
      }
      const pushMarker = readLatestPushMarker(repoFsPath);
      if (pushMarker && pushMarker !== lastPushMarker) {
        lastPushMarker = pushMarker;
        celebratePush(`${source}-push · ${key}`, pushMarker);
      }
      const stashMarker = readLatestStashMarker(repoFsPath);
      if (isNewStashEntry(lastStashMarker, stashMarker)) {
        lastStashMarker = stashMarker;
        celebrateStash(`${source}-stash · ${key}`);
      } else if (stashMarker) {
        lastStashMarker = stashMarker;
      }
    };

    try {
      const watcher = fs.watch(reflogPath, () => checkReflog('reflog.watch'));
      disposables.push({ dispose: () => watcher.close() });
    } catch (err) {
      orbitalLog('Reflog watch failed', `${key} · ${String(err)}`);
    }

    const poll = setInterval(() => checkReflog('reflog.poll'), REFLOG_POLL_MS);
    disposables.push({ dispose: () => clearInterval(poll) });
    orbitalLog('Reflog fast path', `${key} · poll=${REFLOG_POLL_MS}ms · ${reflogPath}`);
  };

  const wireRepo = (repo: GitRepository): void => {
    const key = repo.rootUri.toString();
    if (wiredRoots.has(key)) {
      return;
    }
    wiredRoots.add(key);

    let hooks = 0;
    let lastHeadSha = repo.state.HEAD?.commit;
    const repoPath = repo.rootUri.fsPath;
    wireReflogFastPath(repoPath, key);

    if (typeof repo.onDidRunOperation === 'function') {
      disposables.push(
        repo.onDidRunOperation((ev) => {
          if (ev?.error) {
            return;
          }
          if (isStashOperationKind(ev?.operation?.kind)) {
            celebrateStash(`onDidRunOperation · ${ev?.operation?.kind} · ${key}`);
            return;
          }
          if (isPushOperationKind(ev?.operation?.kind)) {
            celebratePush(`onDidRunOperation · ${ev?.operation?.kind} · ${key}`);
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

    if (typeof repo.state.onDidChange === 'function') {
      disposables.push(
        repo.state.onDidChange(() => {
          const sha = repo.state.HEAD?.commit;
          if (!sha || sha === lastHeadSha) {
            lastHeadSha = sha;
            return;
          }
          lastHeadSha = sha;

          const reflogSha = readLatestCommitShaFromReflog(repoPath);
          if (
            reflogSha &&
            (reflogSha === sha || sha.startsWith(reflogSha) || reflogSha.startsWith(sha))
          ) {
            celebrateCommit(`state.onDidChange+reflog · ${key}`, sha);
            return;
          }
          orbitalLog(
            'HEAD change ignored',
            `${sha.slice(0, 7)} · not a commit reflog entry (pull/checkout/etc.)`,
          );
        }),
      );
      hooks += 1;
    }

    orbitalLog(
      'Git repo wired',
      `${key} · apiHooks=${hooks} · onDidCommit=${typeof repo.onDidCommit === 'function'} · state.onDidChange=${typeof repo.state.onDidChange === 'function'}`,
    );
  };

  const wireWorkspaceFolders = (): void => {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      wireReflogFastPath(folder.uri.fsPath, `workspace:${folder.name}`);
    }
  };

  wireWorkspaceFolders();
  disposables.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => wireWorkspaceFolders()),
  );

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
      orbitalLog('Git extension disabled', 'reflog fast path still active');
      return;
    }
    try {
      const api = git.getAPI(1);
      attachApiListeners(api);
      orbitalLog(
        'Git commit listener active',
        `${api.repositories.length} repo(s) · reflog+api`,
      );
    } catch (err) {
      orbitalLog('Git API unavailable', String(err));
    }
  };

  const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExt) {
    orbitalLog('Git extension not found', 'using workspace reflog only');
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
          if (event.exitCode !== 0) {
            return;
          }
          const cmd = event.execution?.commandLine?.value ?? '';
          if (isStashShellCommand(cmd)) {
            celebrateStash('terminal-stash');
            return;
          }
          if (/\bgit\s+push\b/.test(cmd) && !/--dry-run\b/.test(cmd)) {
            celebratePush('terminal-push');
          }
        }),
      );
      orbitalLog('Terminal push listener active', 'git push exit 0');
    }
  } catch (err) {
    orbitalLog('Terminal push API blocked', String(err));
  }

  return disposables;
}
