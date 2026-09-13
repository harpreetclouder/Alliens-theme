import { describe, expect, it } from 'vitest';
import { formatOrbitCrumb } from '../celebrations/statusBar';

describe('formatOrbitCrumb', () => {
  it('formats level and streak with rocket icon', () => {
    expect(formatOrbitCrumb(3, 5)).toBe('$(rocket) L3 · 🔥5');
    expect(formatOrbitCrumb(1, 0)).toBe('$(rocket) L1 · 🔥0');
  });
});
