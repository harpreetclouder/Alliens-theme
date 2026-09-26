import type { OrbitalExperiencePack, PackId } from './types';

/**
 * Builtin experience packs (v1 manifests).
 * VOID and community packs are documented, not shipped here.
 */
export const EXPERIENCE_PACKS: Record<PackId, OrbitalExperiencePack> = {
  mothership: {
    schemaVersion: 1,
    id: 'mothership',
    name: 'Mothership OS',
    themeLabel: 'Orbital — Mothership OS',
    visualTheme: {
      colorThemePath: './themes/mothership-color-theme.json',
      personality: 'mission-control',
      tokens: {
        accent: '#1cff9a',
        accentSoft: '#5ef2ff',
        surface: '#05070f',
        success: '#1cff9a',
        signal: '#5ef2ff',
      },
      accentMode: 'orbit',
    },
    motion: {
      intensity: 'normal',
      celebrationStyle: 'beam-lift',
      transitionStyle: 'soft-fade',
    },
    sound: { profileId: 'spacecraft', sfxFile: 'mothership.wav' },
    personality: {
      tone: 'mission-control',
      vocabulary: ['mission', 'signal', 'crew', 'dock'],
      outcomeLabels: {
        comeback: 'MISSION RECOVERED',
        celebration: 'TRANSMISSION CLEAR',
        waiting: 'AWAITING SIGNAL…',
        transmission: 'INCOMING UPLINK',
        focus: 'CREW FOCUSED',
      },
    },
    ambient: { defaultEnabled: false, maxIntensity: 1 },
    experienceOverrides: {
      celebrationRenderer: 'mothership-celebration',
    },
  },
  glitch: {
    schemaVersion: 1,
    id: 'glitch',
    name: 'Glitch Transmission',
    themeLabel: 'Orbital — Glitch Transmission',
    visualTheme: {
      colorThemePath: './themes/glitch-color-theme.json',
      personality: 'digital-corruption',
      tokens: {
        accent: '#b8ff40',
        accentSoft: '#ff2d95',
        surface: '#0a0210',
        success: '#b8ff40',
        warning: '#ff2d95',
        signal: '#5ef2ff',
      },
      accentMode: 'glitch',
    },
    motion: {
      intensity: 'expressive',
      celebrationStyle: 'stamp-glitch',
      transitionStyle: 'scanline',
    },
    sound: { profileId: 'glitch', sfxFile: 'glitch.wav' },
    personality: {
      tone: 'glitch',
      vocabulary: ['restore', 'corrupt', 'packet', 'resync'],
      outcomeLabels: {
        comeback: 'SYSTEM RESTORED',
        celebration: 'PACKET LANDED',
        waiting: 'BUFFERING…',
        transmission: 'NOISY CHANNEL',
        focus: 'LOCK ENGAGED',
      },
    },
    ambient: { defaultEnabled: false, maxIntensity: 1 },
    experienceOverrides: { celebrationRenderer: 'glitch-celebration' },
  },
  soft: {
    schemaVersion: 1,
    id: 'soft',
    name: 'Soft Abduction',
    themeLabel: 'Orbital — Soft Abduction',
    visualTheme: {
      colorThemePath: './themes/soft-abduction-color-theme.json',
      personality: 'calm-future',
      tokens: {
        accent: '#f4a261',
        accentSoft: '#c4b5fd',
        surface: '#0c0a12',
        success: '#86efac',
        signal: '#a5f3fc',
      },
      accentMode: 'soft',
    },
    motion: {
      intensity: 'minimal',
      celebrationStyle: 'gentle-float',
      transitionStyle: 'ease-breathe',
    },
    sound: { profileId: 'soft', sfxFile: 'soft.wav' },
    personality: {
      tone: 'calm',
      vocabulary: ['gentle', 'drift', 'glow', 'ease'],
      outcomeLabels: {
        comeback: "You're back on track.",
        celebration: 'Nice work — soft landing.',
        waiting: 'Taking a breath…',
        transmission: 'Quiet note',
        focus: 'Deep focus',
      },
    },
    ambient: { defaultEnabled: false, maxIntensity: 1 },
    experienceOverrides: { celebrationRenderer: 'soft-celebration' },
  },
  root: {
    schemaVersion: 1,
    id: 'root',
    name: 'Root Access',
    themeLabel: 'Orbital — Root Access',
    visualTheme: {
      colorThemePath: './themes/root-access-color-theme.json',
      personality: 'systems-terminal',
      tokens: {
        accent: '#33ff66',
        accentSoft: '#1a1a1a',
        surface: '#050505',
        success: '#33ff66',
        signal: '#33ff66',
      },
      accentMode: 'grid',
    },
    motion: {
      intensity: 'minimal',
      celebrationStyle: 'terminal-ack',
      transitionStyle: 'snap',
    },
    sound: { profileId: 'root', sfxFile: 'root.wav' },
    personality: {
      tone: 'terminal',
      vocabulary: ['sudo', 'process', 'ok', 'exit 0'],
      outcomeLabels: {
        comeback: 'process recovered successfully',
        celebration: 'exit 0',
        waiting: 'awaiting job…',
        transmission: 'stdout',
        focus: 'tty focused',
      },
    },
    ambient: { defaultEnabled: false, maxIntensity: 0 },
    experienceOverrides: { celebrationRenderer: 'root-celebration' },
  },
  acid: {
    schemaVersion: 1,
    id: 'acid',
    name: 'Acid Scrapbook',
    themeLabel: 'Orbital — Acid Scrapbook',
    visualTheme: {
      colorThemePath: './themes/acid-scrapbook-color-theme.json',
      personality: 'high-energy-collage',
      tokens: {
        accent: '#d6ff3c',
        accentSoft: '#ff3dc8',
        surface: '#12081a',
        success: '#d6ff3c',
        warning: '#ff3dc8',
        signal: '#7df9ff',
      },
      accentMode: 'scrapbook',
    },
    motion: {
      intensity: 'expressive',
      celebrationStyle: 'collage-burst',
      transitionStyle: 'peel',
    },
    sound: { profileId: 'acid', sfxFile: 'acid.wav' },
    personality: {
      tone: 'scrapbook',
      vocabulary: ['pin', 'peel', 'sticker', 'iconic'],
      outcomeLabels: {
        comeback: 'PAGE SAVED · YOU\'RE BACK',
        celebration: 'STICKERED ✓',
        waiting: 'INK DRYING…',
        transmission: 'SCRAP DROP',
        focus: 'BOARD LOCKED',
      },
    },
    ambient: { defaultEnabled: false, maxIntensity: 1 },
    experienceOverrides: { celebrationRenderer: 'acid-celebration' },
  },
};

export function getExperiencePack(id: PackId): OrbitalExperiencePack {
  return EXPERIENCE_PACKS[id];
}

export function listExperiencePackIds(): PackId[] {
  return Object.keys(EXPERIENCE_PACKS) as PackId[];
}
