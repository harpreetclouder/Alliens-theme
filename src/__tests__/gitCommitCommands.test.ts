import { describe, it, expect } from 'vitest';
import { GIT_COMMIT_COMMANDS } from '../triggers/gitCommitCommands';

describe('GIT_COMMIT_COMMANDS', () => {
  it('includes primary SCM commit commands', () => {
    expect(GIT_COMMIT_COMMANDS.has('git.commit')).toBe(true);
    expect(GIT_COMMIT_COMMANDS.has('git.commitStaged')).toBe(true);
    expect(GIT_COMMIT_COMMANDS.has('git.commitAll')).toBe(true);
  });

  it('does not include unrelated git commands', () => {
    expect(GIT_COMMIT_COMMANDS.has('git.fetch')).toBe(false);
    expect(GIT_COMMIT_COMMANDS.has('git.push')).toBe(false);
  });
});
