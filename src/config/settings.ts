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
  push?: CelebrationSurfaceSetting;
  debug?: CelebrationSurfaceSetting;
  save?: CelebrationSurfaceSetting;
  task?: CelebrationSurfaceSetting;
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
  push: boolean;
  debug: boolean;
  save: boolean;
  /** Lint, format, typecheck, and other successful tasks. */
  tasks: boolean;
}

export interface OrbitalSettings {
  pack: PackId;
  celebrationsEnabled: boolean;
  /** Spotlight wins whisper. Small chores stay quiet. */
  quietMode: boolean;
  orbitEnabled: boolean;
  display: CelebrationDisplay;
  surfaces: SurfaceOverrides;
  intensity: Intensity;
  triggers: TriggerSettings;
  soundEnabled: boolean;
  mutedPacks: PackId[];
  reduceMotion: ReduceMotion;
  /** auto | region id — locale meme bias */
  joyRegion: string;
  /**
   * Giphy SDK/API key from https://developers.giphy.com/dashboard/
   * Create an app → SDK (or API) key. Upgrade to Production for full rate limits.
   */
  giphySdkKey: string;
}

export interface ConfigLike {
  get<T>(section: string, defaultValue: T): T;
}

const SURFACE_KEYS = [
  'tests',
  'build',
  'commit',
  'push',
  'debug',
  'save',
  'task',
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
  quietMode: false,
  orbitEnabled: true,
  display: 'terminal',
  surfaces: {},
  intensity: 'normal',
  triggers: { tests: true, build: true, commit: true, push: true, debug: true, save: false, tasks: true },
  soundEnabled: true,
  mutedPacks: [],
  reduceMotion: 'auto',
  joyRegion: 'auto',
  giphySdkKey: '',
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
    quietMode: c.get('quietMode', DEFAULTS.quietMode),
    orbitEnabled: c.get('orbit.enabled', DEFAULTS.orbitEnabled),
    display,
    surfaces: readSurfaceOverrides(c),
    intensity,
    triggers: {
      tests: c.get('celebrations.triggers.tests', true),
      build: c.get('celebrations.triggers.build', true),
      commit: c.get('celebrations.triggers.commit', true),
      push: c.get('celebrations.triggers.push', true),
      debug: c.get('celebrations.triggers.debug', true),
      save: c.get('celebrations.triggers.save', false),
      tasks: c.get('celebrations.triggers.tasks', true),
    },
    soundEnabled: c.get('sound.enabled', DEFAULTS.soundEnabled),
    mutedPacks: muted.filter(isPackId),
    reduceMotion,
    joyRegion: c.get('joy.region', DEFAULTS.joyRegion) || 'auto',
    // Prefer SDK key; fall back to legacy apiKey / tenor for older settings
    giphySdkKey:
      c.get('giphy.sdkKey', '') ||
      c.get('giphy.apiKey', DEFAULTS.giphySdkKey) ||
      c.get('tenor.apiKey', '') ||
      '',
  };
}
