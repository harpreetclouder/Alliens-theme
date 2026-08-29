import { WinEvent } from './types';

export class CelebrationThrottle {
  private lastSmallAt = -Infinity;

  constructor(private readonly windowMs = 45_000) {}

  allow(event: WinEvent, now = Date.now()): boolean {
    if (event.size === 'big') {
      return true;
    }
    if (now - this.lastSmallAt < this.windowMs) {
      return false;
    }
    this.lastSmallAt = now;
    return true;
  }
}
