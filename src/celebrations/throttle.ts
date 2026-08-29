import { WinEvent } from './types';

export class CelebrationThrottle {
  private lastSmallAt = -Infinity;

  constructor(private readonly windowMs = 45_000) {}

  allow(event: WinEvent, now = Date.now()): boolean {
    // Intentional wins (tests, builds) should celebrate every time.
    if (event.size === 'big' || event.kind === 'tests') {
      return true;
    }
    if (now - this.lastSmallAt < this.windowMs) {
      return false;
    }
    this.lastSmallAt = now;
    return true;
  }
}
