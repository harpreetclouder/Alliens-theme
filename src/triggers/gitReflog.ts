import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseCommitShaFromReflogLine } from './gitCommitDetect';

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
