import { isPackId } from '../packs/registry';
import type { PackId } from '../packs/types';

export type Intensity = 'chill' | 'normal' | 'hype';
export type ReduceMotion = 'auto' | 'always' | 'never';
export type CelebrationDisplay = 'terminal' | 'panel' | 'overlay';
export type CelebrationSurfaceSetting = 'terminal' | 'panel' | 'overlay' | 'statusbar';

export interface SurfaceOverrides {
  tests?: CelebrationSurfaceSetting;
  build?: CelebrationSurfaceSetting;
  commit?: CelebrationSurfaceSetting;
  debug?: CelebrationSurfaceSetting;
  save?: CelebrationSurfaceSetting;
  preview?: CelebrationSurfaceSetting;
  checkin?: CelebrationSurfaceSetting;
  pack?: CelebrationSurfaceSetting;
  levelup?: CelebrationSurfaceSetting;
  achievement?: CelebrationSurfaceSetting;
  mission?: CelebrationSurfaceSetting;
}

export interface TriggerSettings {
  tests: boolean;
  build: boolean;
  commit: boolean;
  debug: boolean;
  save: boolean;
}

export interface OrbitalSettings {
  pack: PackId;
  celebrationsEnabled: boolean;
  orbitEnabled: boolean;
  display: CelebrationDisplay;
  surfaces: SurfaceOverrides;
  intensity: Intensity;
  triggers: TriggerSettings;
  soundEnabled: boolean;
  mutedPacks: PackId[];
  reduceMotion: ReduceMotion;
}

export interface ConfigLike {
  get<T>(section: string, defaultValue: T): T;
}

const SURFACE_KEYS = [
  'tests',
  'build',
  'commit',
  'debug',
  'save',
  'preview',
  'checkin',
  'pack',
  'levelup',
  'achievement',
  'mission',
] as const;
const VALID_SURFACES = new Set<CelebrationSurfaceSetting>([
  'terminal',
  'panel',
  'overlay',
  'statusbar',
]);

function readSurfaceOverrides(c: ConfigLike): SurfaceOverrides {
  const raw = c.get<Record<string, string>>('celebrations.surfaces', {});
  const out: SurfaceOverrides = {};
  for (const key of SURFACE_KEYS) {
    const v = raw[key];
    if (typeof v === 'string' && VALID_SURFACES.has(v as CelebrationSurfaceSetting)) {
      out[key] = v as CelebrationSurfaceSetting;
    }
  }
  return out;
}

const DEFAULTS: OrbitalSettings = {
  pack: 'mothership',
  celebrationsEnabled: true,
  orbitEnabled: true,
  display: 'terminal',
  surfaces: {},
  intensity: 'normal',
  triggers: { tests: true, build: true, commit: true, debug: true, save: false },
  soundEnabled: true,
  mutedPacks: [],
  reduceMotion: 'auto',
};

export function readSettings(getConfig: () => ConfigLike): OrbitalSettings {
  const c = getConfig();
  const packRaw = c.get<string>('pack', DEFAULTS.pack);
  const intensityRaw = c.get<string>('celebrations.intensity', DEFAULTS.intensity);
  const displayRaw = c.get<string>('celebrations.display', DEFAULTS.display);
  const reduceRaw = c.get<string>('reduceMotion', DEFAULTS.reduceMotion);
  const muted = c.get<string[]>('sound.mutedPacks', []);

  const intensity: Intensity =
    intensityRaw === 'chill' || intensityRaw === 'normal' || intensityRaw === 'hype'
      ? intensityRaw
      : 'normal';

  const reduceMotion: ReduceMotion =
    reduceRaw === 'auto' || reduceRaw === 'always' || reduceRaw === 'never'
      ? reduceRaw
      : 'auto';

  const display: CelebrationDisplay =
    displayRaw === 'overlay'
      ? 'overlay'
      : displayRaw === 'panel'
        ? 'panel'
        : 'terminal';

  return {
    pack: isPackId(packRaw) ? packRaw : 'mothership',
    celebrationsEnabled: c.get('celebrations.enabled', true),
    orbitEnabled: c.get('orbit.enabled', DEFAULTS.orbitEnabled),
    display,
    surfaces: readSurfaceOverrides(c),
    intensity,
    triggers: {
      tests: c.get('celebrations.triggers.tests', true),
      build: c.get('celebrations.triggers.build', true),
      commit: c.get('celebrations.triggers.commit', true),
      debug: c.get('celebrations.triggers.debug', true),
      save: c.get('celebrations.triggers.save', false),
    },
    soundEnabled: c.get('sound.enabled', DEFAULTS.soundEnabled),
    mutedPacks: muted.filter(isPackId),
    reduceMotion,
  };
}
