/** Pure helpers for git commit detection (no vscode import — unit-testable). */

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
