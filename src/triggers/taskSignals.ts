/** Commands another trigger already celebrates. */
const CLAIMED_CMD_RE =
  /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|build|compile)\b|\b(?:vitest|jest|pytest|mocha|phpunit|tsc|vite\s+build)\b|\bgit\s+push\b|\bgit\s+stash\b|\bnpm\s+test\b/i;

/** Long-running or noisy commands that are not a finished task. */
const SKIP_TASK_RE = /\b(?:dev|start|watch)\b/i;

/** Finished day-to-day chores that are not commit, push, test, or build. */
const CHORE_CMD_RE =
  /\b(?:eslint|prettier|biome|oxlint|ruff|mypy|pyright|stylelint|phpstan|rubocop|golangci-lint)\b|\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:lint|format|fmt|typecheck|check)\b|\bcargo\s+check\b|\bgo\s+vet\b/i;

const SCRIPT_CMD_RE = /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[A-Za-z0-9:_@./-]+\b/;

const TEST_TASK_RE =
  /test|jest|vitest|pytest|mocha|phpunit|npm.*test|pnpm.*test|yarn test|run tests/i;
const BUILD_TASK_RE = /build|compile|webpack|vite build|tsc/i;

export function isCompletedChoreCommand(command: string): boolean {
  const cmd = command.trim();
  if (!cmd || CLAIMED_CMD_RE.test(cmd) || SKIP_TASK_RE.test(cmd)) {
    return false;
  }
  return CHORE_CMD_RE.test(cmd) || SCRIPT_CMD_RE.test(cmd);
}

/** True when a successful IDE task is not already a test or build win. */
export function isGenericCompletedTask(label: string): boolean {
  const name = label.trim();
  if (!name) {
    return false;
  }
  if (TEST_TASK_RE.test(name) || BUILD_TASK_RE.test(name)) {
    return false;
  }
  return true;
}
