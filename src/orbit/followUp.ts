import type { Intensity } from '../config/settings';
import { CELEBRATION_DURATION_MS } from '../celebrations/durations';
import type { CelebrationSurface } from '../celebrations/surface';

/** Chill keeps Orbit follow-ups on statusbar; normal/hype keep panel/overlay. */
export function orbitFollowUpPresentation(
  intensity: Intensity,
  tier: 'medium' | 'big',
): { surface: CelebrationSurface; mode: 'toast' | 'overlay'; durationMs: number } {
  if (intensity === 'chill') {
    return {
      surface: 'statusbar',
      mode: 'toast',
      durationMs: CELEBRATION_DURATION_MS.toast,
    };
  }
  if (tier === 'medium') {
    return {
      surface: 'panel',
      mode: 'overlay',
      durationMs: CELEBRATION_DURATION_MS.scene,
    };
  }
  return {
    surface: 'overlay',
    mode: 'overlay',
    durationMs: CELEBRATION_DURATION_MS.scene,
  };
}
