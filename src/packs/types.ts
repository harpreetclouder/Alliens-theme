export type PackId = 'mothership' | 'glitch' | 'soft' | 'root' | 'acid';

/** Compatibility view — prefer OrbitalExperiencePack for new code. */
export interface PackDefinition {
  id: PackId;
  label: string;
  themePath: string;
  sfxFile: string;
  /** Hex accent used to tint shared library loops (= tokens.accent) */
  tint: string;
}

/** Presentation states for Orbital-owned UI — not brain domain outcomes. */
export type VisualState =
  | 'normal'
  | 'focus'
  | 'waiting'
  | 'celebration'
  | 'comeback'
  | 'transmission'
  | 'quiet';

export type MotionIntensity = 'off' | 'minimal' | 'normal' | 'expressive';

export type PersonalityTone =
  | 'mission-control'
  | 'glitch'
  | 'calm'
  | 'terminal'
  | 'scrapbook';

export type AccentMode = 'orbit' | 'glitch' | 'soft' | 'grid' | 'scrapbook';

export interface DesignTokens {
  accent: string;
  accentSoft?: string;
  surface?: string;
  success?: string;
  warning?: string;
  signal?: string;
}

export interface PackMotionProfile {
  intensity: MotionIntensity;
  celebrationStyle: string;
  transitionStyle: string;
}

export interface PackSoundProfile {
  profileId: string;
  sfxFile: string;
}

export interface PackPersonality {
  tone: PersonalityTone;
  vocabulary?: string[];
  /** Same domain outcome → pack-flavored short label */
  outcomeLabels?: Partial<
    Record<'comeback' | 'celebration' | 'waiting' | 'transmission' | 'focus', string>
  >;
}

export interface PackAmbientSpec {
  /** Declared preference; host must still respect reduced-motion / visibility */
  defaultEnabled: boolean;
  maxIntensity: 0 | 1 | 2;
}

export interface PackExperienceOverrides {
  celebrationRenderer?: string;
  transmissionRenderer?: string;
  puzzleRenderer?: string;
  arcadeRenderer?: string;
}

/**
 * Progressive experience pack — themes are one facet of a coherent world.
 * Domain outcomes stay pack-independent; packs control presentation only.
 */
export interface OrbitalExperiencePack {
  schemaVersion: 1;
  id: PackId;
  name: string;
  /** Official workbench.colorTheme display name */
  themeLabel: string;
  visualTheme: {
    colorThemePath: string;
    personality: string;
    tokens: DesignTokens;
    accentMode: AccentMode;
  };
  motion: PackMotionProfile;
  sound?: PackSoundProfile;
  personality: PackPersonality;
  ambient?: PackAmbientSpec;
  experienceOverrides?: PackExperienceOverrides;
}

export interface PresentationResolved {
  visualState: VisualState;
  tokens: DesignTokens;
  /** Deprecated alias — accent */
  tint: string;
  motionBudget: MotionIntensity;
  ambientIntensity: 0 | 1 | 2;
  outcomeLabel?: string;
  celebrationStyle: string;
  accentMode: AccentMode;
  surfaceHints: {
    preferStatusbar: boolean;
    allowOverlay: boolean;
    allowAmbient: boolean;
  };
}
