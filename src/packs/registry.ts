import { EXPERIENCE_PACKS } from './experiencePacks';
import type { PackDefinition, PackId } from './types';

function toPackDefinition(id: PackId): PackDefinition {
  const xp = EXPERIENCE_PACKS[id];
  return {
    id,
    label: xp.name,
    themePath: xp.visualTheme.colorThemePath,
    sfxFile: xp.sound?.sfxFile ?? `${id}.wav`,
    tint: xp.visualTheme.tokens.accent,
  };
}

/** Compatibility registry — backed by experience pack manifests. */
export const PACKS: Record<PackId, PackDefinition> = {
  mothership: toPackDefinition('mothership'),
  glitch: toPackDefinition('glitch'),
  soft: toPackDefinition('soft'),
  root: toPackDefinition('root'),
  acid: toPackDefinition('acid'),
};

export function isPackId(value: string): value is PackId {
  return value in PACKS;
}

export function getPack(id: PackId): PackDefinition {
  return PACKS[id];
}

/** workbench.colorTheme labels — single source from manifests */
export const PACK_THEME_LABELS: Record<PackId, string> = {
  mothership: EXPERIENCE_PACKS.mothership.themeLabel,
  glitch: EXPERIENCE_PACKS.glitch.themeLabel,
  soft: EXPERIENCE_PACKS.soft.themeLabel,
  root: EXPERIENCE_PACKS.root.themeLabel,
  acid: EXPERIENCE_PACKS.acid.themeLabel,
};

export { getExperiencePack, listExperiencePackIds, EXPERIENCE_PACKS } from './experiencePacks';
export { resolveVisualState } from './visualState';
export { resolvePresentation } from './presentation';
