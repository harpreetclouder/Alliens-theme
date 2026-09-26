import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPushReflogMessage, parseCommitShaFromReflogLine } from './gitCommitDetect';

/** Resolve path to logs/HEAD (handles linked worktrees via gitdir: file). */
export function resolveHeadReflogPath(repoFsPath: string): string | undefined {
  const direct = path.join(repoFsPath, '.git', 'logs', 'HEAD');
  if (fs.existsSync(direct)) {
    return direct;
  }

  const gitMeta = path.join(repoFsPath, '.git');
  try {
    if (!fs.existsSync(gitMeta) || !fs.statSync(gitMeta).isFile()) {
      return undefined;
    }
    const content = fs.readFileSync(gitMeta, 'utf8');
    const match = /^gitdir:\s*(.+)$/m.exec(content);
    if (!match) {
      return undefined;
    }
    const gitdir = path.resolve(repoFsPath, match[1].trim());
    const linked = path.join(gitdir, 'logs', 'HEAD');
    return fs.existsSync(linked) ? linked : undefined;
  } catch {
    return undefined;
  }
}

function gitDirForRepo(repoFsPath: string): string | undefined {
  const head = resolveHeadReflogPath(repoFsPath);
  if (!head) {
    return undefined;
  }
  // …/logs/HEAD → git dir
  return path.dirname(path.dirname(head));
}

function lastReflogFields(filePath: string): { sha?: string; message?: string } {
  try {
    const text = fs.readFileSync(filePath, 'utf8').trimEnd();
    const last = text.split('\n').pop() ?? '';
    const tab = last.indexOf('\t');
    if (tab < 0) {
      return {};
    }
    const meta = last.slice(0, tab).split(' ');
    return { sha: meta[1], message: last.slice(tab + 1) };
  } catch {
    return {};
  }
}

function walkFiles(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
}

/**
 * Latest remote-tracking reflog line that is a push.
 * Marker is `sha@mtime` so a new push of the same SHA still fires.
 */
export function readLatestPushMarker(repoFsPath: string): string | undefined {
  const gitDir = gitDirForRepo(repoFsPath);
  if (!gitDir) {
    return undefined;
  }
  const remotes = path.join(gitDir, 'logs', 'refs', 'remotes');
  const files: string[] = [];
  walkFiles(remotes, files);
  let bestMtime = 0;
  let best: string | undefined;
  for (const file of files) {
    const fields = lastReflogFields(file);
    if (!fields.sha || !fields.message || !isPushReflogMessage(fields.message)) {
      continue;
    }
    let mtime = 0;
    try {
      mtime = fs.statSync(file).mtimeMs;
    } catch {
      continue;
    }
    if (mtime >= bestMtime) {
      bestMtime = mtime;
      best = `${fields.sha}@${Math.floor(mtime)}`;
    }
  }
  return best;
}

/** Read last reflog line; return SHA if that line is a real commit. */
export function readLatestCommitShaFromReflog(repoFsPath: string): string | undefined {
  const reflogPath = resolveHeadReflogPath(repoFsPath);
  if (!reflogPath) {
    return undefined;
  }
  try {
    const text = fs.readFileSync(reflogPath, 'utf8');
    const lines = text.trimEnd().split('\n');
    const last = lines[lines.length - 1];
    return last ? parseCommitShaFromReflogLine(last) : undefined;
  } catch {
    return undefined;
  }
}
