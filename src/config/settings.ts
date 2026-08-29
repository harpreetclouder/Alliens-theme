import { isPackId } from '../packs/registry';
import type { PackId } from '../packs/types';

export type Intensity = 'chill' | 'normal' | 'hype';
export type ReduceMotion = 'auto' | 'always' | 'never';

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
  intensity: Intensity;
  triggers: TriggerSettings;
  soundEnabled: boolean;
  mutedPacks: PackId[];
  reduceMotion: ReduceMotion;
}

export interface ConfigLike {
  get<T>(section: string, defaultValue: T): T;
}

const DEFAULTS: OrbitalSettings = {
  pack: 'mothership',
  celebrationsEnabled: true,
  intensity: 'normal',
  triggers: { tests: true, build: true, commit: true, debug: true, save: false },
  soundEnabled: false,
  mutedPacks: [],
  reduceMotion: 'auto',
};

export function readSettings(getConfig: () => ConfigLike): OrbitalSettings {
  const c = getConfig();
  const packRaw = c.get<string>('pack', DEFAULTS.pack);
  const intensityRaw = c.get<string>('celebrations.intensity', DEFAULTS.intensity);
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

  return {
    pack: isPackId(packRaw) ? packRaw : 'mothership',
    celebrationsEnabled: c.get('celebrations.enabled', true),
    intensity,
    triggers: {
      tests: c.get('celebrations.triggers.tests', true),
      build: c.get('celebrations.triggers.build', true),
      commit: c.get('celebrations.triggers.commit', true),
      debug: c.get('celebrations.triggers.debug', true),
      save: c.get('celebrations.triggers.save', false),
    },
    soundEnabled: c.get('sound.enabled', false),
    mutedPacks: muted.filter(isPackId),
    reduceMotion,
  };
}
