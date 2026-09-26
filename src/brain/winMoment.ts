import type { Intensity } from '../config/settings';
import type { WinKind, WinSize } from '../celebrations/types';

/** Repeat gap for the same small chore (save, lint, format). */
export const SMALL_TASK_GAP_MS = 12_000;
/** No celebration this long → the next finished chore gets a full beat. */
export const QUIET_STRETCH_MS = 90_000;

const SPOTLIGHT = new Set<WinKind>([
  'commit',
  'push',
  'stash',
  'build',
  'mission',
  'levelup',
  'achievement',
  'preview',
]);

export interface MomentStamp {
  kind: WinKind;
  atMs: number;
}

export interface WinMomentContext {
  kind: WinKind;
  size: WinSize;
  typing: boolean;
  quietMode: boolean;
  celebrationsEnabled: boolean;
  intensity: Intensity;
  nowMs: number;
  recent: readonly MomentStamp[];
}

export interface WinMomentDecision {
  show: boolean;
  /** Hard surface. Omitted means the pack/settings surface stays. */
  forceSurface?: 'statusbar' | 'overlay';
  reason: string;
}

function lastSameAt(recent: readonly MomentStamp[], kind: WinKind): number | null {
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    if (recent[i].kind === kind) {
      return recent[i].atMs;
    }
  }
  return null;
}

function isSpotlight(kind: WinKind, size: WinSize): boolean {
  return SPOTLIGHT.has(kind) || (kind === 'tests' && size === 'big');
}

/**
 * Context decision for a finished piece of work.
 * Spotlight wins stay celebrations. Small chores whisper, with a full beat
 * after a quiet stretch. Typing and quiet mode never open an overlay.
 */
export function decideWinMoment(ctx: WinMomentContext): WinMomentDecision {
  if (!ctx.celebrationsEnabled) {
    return { show: false, reason: 'celebrations disabled' };
  }

  const spotlight = isSpotlight(ctx.kind, ctx.size);
  const small = ctx.kind === 'save';
  const finishedTask = ctx.kind === 'task';

  if (ctx.quietMode) {
    if (!spotlight) {
      return { show: false, reason: 'quiet → skip small moment' };
    }
    return { show: true, forceSurface: 'statusbar', reason: 'quiet → spotlight whisper' };
  }

  if (finishedTask) {
    const prev = lastSameAt(ctx.recent, ctx.kind);
    if (prev != null && ctx.nowMs - prev < SMALL_TASK_GAP_MS) {
      return { show: false, reason: 'small task burst → wait' };
    }
    if (ctx.typing || ctx.intensity === 'chill') {
      return {
        show: true,
        forceSurface: 'statusbar',
        reason: ctx.typing ? 'typing → whisper the chore' : 'chill → whisper',
      };
    }
    return { show: true, forceSurface: 'overlay', reason: 'finished task → celebration' };
  }

  if (small) {
    const prev = lastSameAt(ctx.recent, ctx.kind);
    if (prev != null && ctx.nowMs - prev < SMALL_TASK_GAP_MS) {
      return { show: false, reason: 'small task burst → wait' };
    }
    const lastAny = ctx.recent.length > 0 ? ctx.recent[ctx.recent.length - 1].atMs : null;
    const afterPause = lastAny == null || ctx.nowMs - lastAny >= QUIET_STRETCH_MS;
    if (afterPause && !ctx.typing && ctx.intensity !== 'chill') {
      return { show: true, forceSurface: 'overlay', reason: 'finished chore after a pause → full beat' };
    }
    return {
      show: true,
      forceSurface: 'statusbar',
      reason: ctx.typing ? 'typing → whisper the chore' : 'small task → whisper',
    };
  }

  if (ctx.typing || ctx.intensity === 'chill') {
    return {
      show: true,
      forceSurface: 'statusbar',
      reason: ctx.typing ? 'typing → whisper, keep flow' : 'chill → whisper',
    };
  }

  return {
    show: true,
    reason: spotlight ? 'spotlight win → full celebration' : 'finished work → celebration',
  };
}
