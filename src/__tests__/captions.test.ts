import { describe, it, expect } from 'vitest';
import { pickCaption } from '../celebrations/captions';

describe('pickCaption', () => {
  it('returns a line from the pack pool', () => {
    const { line } = pickCaption('tests', 'mothership', () => 0);
    expect(line).toBe('TASK ✓ BEAMED UP');
  });

  it('rotates lines with different random values', () => {
    const a = pickCaption('tests', 'mothership', () => 0).line;
    const b = pickCaption('tests', 'mothership', () => 0.99).line;
    expect(a).not.toBe(b);
  });

  it('includes an optional subline', () => {
    const { subline } = pickCaption('tests', 'glitch', () => 0.5);
    expect(subline).toBeTruthy();
    expect(typeof subline).toBe('string');
  });
});
