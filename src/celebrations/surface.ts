import { Intensity, SurfaceOverrides } from '../config/settings';
import { WinKind, WinSize } from './types';

export type CelebrationSurface = 'terminal' | 'panel' | 'overlay' | 'statusbar';

export const DEFAULT_SURFACES: Record<WinKind, CelebrationSurface> = {
  tests: 'terminal',
  preview: 'overlay',
  build: 'panel',
  commit: 'panel',
  debug: 'panel',
  save: 'statusbar',
  checkin: 'statusbar',
  pack: 'statusbar',
  levelup: 'panel',
  achievement: 'panel',
  mission: 'overlay',
};

const VALID: CelebrationSurface[] = ['terminal', 'panel', 'overlay', 'statusbar'];

function isSurface(v: string): v is CelebrationSurface {
  return (VALID as string[]).includes(v);
}

export function resolveSurface(
  kind: WinKind,
  size: WinSize,
  surfaces: SurfaceOverrides,
  intensity: Intensity,
  meta: { terminalNative?: boolean } | undefined,
  fallbackDisplay: 'panel' | 'overlay',
): CelebrationSurface {
  if (meta?.terminalNative || kind === 'tests') {
    return 'terminal';
  }

  if (kind === 'preview') {
    return 'overlay';
  }

  if (intensity === 'chill') {
    return 'statusbar';
  }

  const override = surfaces[kind];
  if (override && isSurface(override)) {
    return override;
  }

  if (intensity === 'hype' && size === 'big') {
    return 'overlay';
  }

  const base = DEFAULT_SURFACES[kind];
  if (base === 'terminal') {
    return 'terminal';
  }
  if (base === 'statusbar') {
    return 'statusbar';
  }
  return fallbackDisplay === 'overlay' ? 'overlay' : 'panel';
}
