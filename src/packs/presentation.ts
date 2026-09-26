import type {
  MotionIntensity,
  OrbitalExperiencePack,
  PresentationResolved,
  VisualState,
} from './types';
import { getExperiencePack } from './experiencePacks';
import type { PackId } from './types';

export interface PresentationPrefs {
  reduceMotion?: boolean;
  celebrationsEnabled?: boolean;
  quietMode?: boolean;
  typing?: boolean;
}

function clampMotion(
  packLevel: MotionIntensity,
  state: VisualState,
  reduceMotion: boolean,
): MotionIntensity {
  if (reduceMotion || state === 'quiet' || state === 'focus') {
    return 'off';
  }
  if (state === 'waiting') {
    return packLevel === 'expressive' ? 'minimal' : packLevel === 'off' ? 'off' : 'minimal';
  }
  return packLevel;
}

function ambientFor(state: VisualState, pack: OrbitalExperiencePack, reduceMotion: boolean): 0 | 1 | 2 {
  if (reduceMotion || state === 'quiet' || state === 'focus') {
    return 0;
  }
  const max = pack.ambient?.maxIntensity ?? 0;
  if (!pack.ambient?.defaultEnabled) {
    return 0;
  }
  if (state === 'waiting') {
    return Math.min(1, max) as 0 | 1 | 2;
  }
  if (state === 'normal') {
    return Math.min(1, max) as 0 | 1 | 2;
  }
  return 0;
}

/**
 * Pure presentation resolver — brain outcomes stay independent of pack.
 */
export function resolvePresentation(
  packId: PackId,
  visualState: VisualState,
  prefs: PresentationPrefs = {},
): PresentationResolved {
  const pack = getExperiencePack(packId);
  const reduceMotion = Boolean(prefs.reduceMotion);
  const motionBudget = clampMotion(pack.motion.intensity, visualState, reduceMotion);
  const ambientIntensity = ambientFor(visualState, pack, reduceMotion);

  const outcomeKey =
    visualState === 'comeback' ||
    visualState === 'celebration' ||
    visualState === 'waiting' ||
    visualState === 'transmission' ||
    visualState === 'focus'
      ? visualState
      : undefined;

  const outcomeLabel = outcomeKey
    ? pack.personality.outcomeLabels?.[outcomeKey]
    : undefined;

  const allowOverlay =
    prefs.celebrationsEnabled !== false &&
    (visualState === 'celebration' ||
      visualState === 'comeback' ||
      visualState === 'transmission');

  const preferStatusbar =
    visualState === 'waiting' ||
    visualState === 'comeback' ||
    pack.motion.intensity === 'minimal';

  return {
    visualState,
    tokens: pack.visualTheme.tokens,
    tint: pack.visualTheme.tokens.accent,
    motionBudget,
    ambientIntensity,
    outcomeLabel,
    celebrationStyle: pack.motion.celebrationStyle,
    accentMode: pack.visualTheme.accentMode,
    surfaceHints: {
      preferStatusbar,
      allowOverlay,
      allowAmbient: ambientIntensity > 0,
    },
  };
}
