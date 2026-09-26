/** Pure helpers for git commit detection (no vscode import — unit-testable). */

export function isPushOperationKind(kind: string | undefined): boolean {
  if (!kind) {
    return false;
  }
  const normalized = kind.toLowerCase();
  if (normalized.includes('pull')) {
    return false;
  }
  return normalized === 'push' || normalized.startsWith('push');
}

/** Message after the reflog tab — `update by push` or `push: …`, not commit text. */
export function isPushReflogMessage(message: string): boolean {
  const msg = message.trim();
  return /^update by push\b/i.test(msg) || /^push\b/i.test(msg);
}

export function isCommitOperationKind(kind: string | undefined): boolean {
  if (!kind) {
    return false;
  }
  const normalized = kind.toLowerCase();
  return (
    normalized === 'commit' ||
    normalized === 'commitall' ||
    normalized === 'commitstaged' ||
    normalized.includes('commit')
  );
}

/**
 * Parse a git reflog HEAD line. Returns new SHA only for real commits
 * (`commit:`, `commit (amend):`, …) — not checkout/pull/reset/merge ops.
 *
 * Format: `<old> <new> <name> <email> <ts> <tz>\t<message>`
 */
export function parseCommitShaFromReflogLine(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed) {
    return undefined;
  }
  const tabIdx = trimmed.indexOf('\t');
  if (tabIdx < 0) {
    return undefined;
  }
  const meta = trimmed.slice(0, tabIdx);
  const msg = trimmed.slice(tabIdx + 1);
  // "commit: …" | "commit (amend): …" | "commit (merge): …" | "commit (cherry-pick): …"
  if (!/^commit(\s*\(|:)/.test(msg)) {
    return undefined;
  }
  const parts = meta.split(' ');
  if (parts.length < 2) {
    return undefined;
  }
  const newSha = parts[1];
  if (!/^[0-9a-f]{7,40}$/i.test(newSha)) {
    return undefined;
  }
  return newSha;
}
