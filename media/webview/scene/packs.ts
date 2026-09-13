import type { PackPalette } from './types';

const DEFAULTS: PackPalette = {
  tint: '#1cff9a',
  secondary: '#ff2d95',
  tertiary: '#5ef2ff',
  fog: '#05070f',
  fogNear: 8,
  fogFar: 42,
  particleCount: 1400,
  accentMode: 'orbit',
  starBrightness: 1,
};

const PACKS: Record<string, Partial<PackPalette>> = {
  mothership: {
    tint: '#1cff9a',
    secondary: '#5ef2ff',
    tertiary: '#a78bfa',
    fog: '#030712',
    accentMode: 'orbit',
    particleCount: 1600,
  },
  glitch: {
    tint: '#ff2d95',
    secondary: '#5ef2ff',
    tertiary: '#f0ff3d',
    fog: '#0a0210',
    fogNear: 6,
    fogFar: 36,
    accentMode: 'glitch',
    particleCount: 1800,
    starBrightness: 1.2,
  },
  soft: {
    tint: '#c4b5fd',
    secondary: '#f9a8d4',
    tertiary: '#a5f3fc',
    fog: '#0c0a12',
    fogNear: 10,
    fogFar: 48,
    accentMode: 'soft',
    particleCount: 900,
    starBrightness: 0.75,
  },
  root: {
    tint: '#22c55e',
    secondary: '#84cc16',
    tertiary: '#fbbf24',
    fog: '#020805',
    accentMode: 'grid',
    particleCount: 1200,
  },
  acid: {
    tint: '#d6ff3c',
    secondary: '#ff2d95',
    tertiary: '#5ef2ff',
    fog: '#0c0a0f',
    fogNear: 7,
    fogFar: 40,
    accentMode: 'scrapbook',
    particleCount: 1700,
    starBrightness: 1.15,
  },
};

export function resolvePackPalette(pack: string, tintOverride?: string): PackPalette {
  const partial = PACKS[pack] ?? {};
  const base = { ...DEFAULTS, ...partial };
  if (tintOverride) {
    base.tint = tintOverride;
  }
  return base;
}
