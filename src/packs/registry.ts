import { PackDefinition, PackId } from './types';

export const PACKS: Record<PackId, PackDefinition> = {
  mothership: {
    id: 'mothership',
    label: 'Mothership OS',
    themePath: './themes/mothership-color-theme.json',
    sfxFile: 'mothership.wav',
    tint: '#1cff9a',
  },
  glitch: {
    id: 'glitch',
    label: 'Glitch Transmission',
    themePath: './themes/glitch-color-theme.json',
    sfxFile: 'glitch.wav',
    tint: '#b8ff40',
  },
  soft: {
    id: 'soft',
    label: 'Soft Abduction',
    themePath: './themes/soft-abduction-color-theme.json',
    sfxFile: 'soft.wav',
    tint: '#f4a261',
  },
  root: {
    id: 'root',
    label: 'Root Access',
    themePath: './themes/root-access-color-theme.json',
    sfxFile: 'root.wav',
    tint: '#33ff66',
  },
};

export function isPackId(value: string): value is PackId {
  return value in PACKS;
}

export function getPack(id: PackId): PackDefinition {
  return PACKS[id];
}
