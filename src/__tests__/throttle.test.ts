import { describe, it, expect } from 'vitest';
import { CelebrationThrottle } from '../celebrations/throttle';

describe('CelebrationThrottle', () => {
  it('blocks small wins inside 45s window', () => {
    const t = new CelebrationThrottle(45_000);
    expect(t.allow({ kind: 'commit', size: 'small' }, 1000)).toBe(true);
    expect(t.allow({ kind: 'commit', size: 'small' }, 20_000)).toBe(false);
    expect(t.allow({ kind: 'commit', size: 'small' }, 46_000)).toBe(true);
  });

  it('always allows big wins', () => {
    const t = new CelebrationThrottle(45_000);
    t.allow({ kind: 'commit', size: 'small' }, 1000);
    expect(t.allow({ kind: 'build', size: 'big' }, 2000)).toBe(true);
  });
});
