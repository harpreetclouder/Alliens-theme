import type { OutcomeId } from '../brain/types';
import type { VisualState } from './types';

export interface VisualStateContext {
  /** Brain outcome when available (pack-independent). */
  outcome?: OutcomeId | null;
  typing?: boolean;
  quietMode?: boolean;
  /** Long idle / waiting without a win */
  waiting?: boolean;
  /** Rare curated transmission beat */
  transmission?: boolean;
}

/**
 * Map domain + platform context → presentation state.
 * Pack id must never change the result.
 */
export function resolveVisualState(ctx: VisualStateContext): VisualState {
  if (ctx.quietMode) {
    return 'quiet';
  }
  if (ctx.typing) {
    return 'focus';
  }
  if (ctx.transmission) {
    return 'transmission';
  }

  const outcome = ctx.outcome;
  if (outcome === 'comeback') {
    return 'comeback';
  }
  if (outcome === 'celebration' || outcome === 'overlay') {
    return 'celebration';
  }
  if (outcome === 'intermission') {
    return 'waiting';
  }
  if (ctx.waiting) {
    return 'waiting';
  }
  return 'normal';
}
