import { describe, expect, it } from 'vitest';
import { formatOrbitCrumb } from '../celebrations/statusBar';

describe('formatOrbitCrumb', () => {
  it('formats level and streak', () => {
    expect(formatOrbitCrumb(3, 5)).toBe('L3 · 🔥5');
    expect(formatOrbitCrumb(1, 0)).toBe('L1 · 🔥0');
  });
});
