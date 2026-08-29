import { describe, it, expect } from 'vitest';
import { classifyKind, resolveDisplay } from '../celebrations/classifier';

describe('classifyKind', () => {
  it('marks build as big and commit as small', () => {
    expect(classifyKind('build')).toBe('big');
    expect(classifyKind('commit')).toBe('small');
    expect(classifyKind('tests', { fullSuite: true })).toBe('big');
    expect(classifyKind('tests', { fullSuite: false })).toBe('small');
  });
});

describe('resolveDisplay', () => {
  it('chill forces toast', () => {
    expect(resolveDisplay('tests', 'big', 'chill', 0)).toBe('toast');
  });
  it('normal maps size to mode', () => {
    expect(resolveDisplay('build', 'big', 'normal', 0)).toBe('overlay');
    expect(resolveDisplay('commit', 'small', 'normal', 0)).toBe('toast');
  });
  it('normal uses overlay for tests even when small', () => {
    expect(resolveDisplay('tests', 'small', 'normal', 0)).toBe('overlay');
  });
  it('hype upgrades every 3rd small', () => {
    expect(resolveDisplay('commit', 'small', 'hype', 0)).toBe('overlay');
    expect(resolveDisplay('commit', 'small', 'hype', 1)).toBe('toast');
    expect(resolveDisplay('commit', 'small', 'hype', 3)).toBe('overlay');
  });
});
