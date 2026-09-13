export type SceneSurface = 'overlay' | 'panel';

export interface SceneBootPayload {
  pack: string;
  caption: string;
  subline?: string;
  tint: string;
  durationMs: number;
  exitLeadMs: number;
  reduceMotion: boolean;
  /** When true, honor prefers-reduced-motion in the webview. */
  autoReduce?: boolean;
  surface: SceneSurface;
  gifUri?: string;
  emoji?: string;
  tone?: string;
}

export interface PackPalette {
  tint: string;
  secondary: string;
  tertiary: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  particleCount: number;
  accentMode: 'orbit' | 'glitch' | 'soft' | 'grid' | 'scrapbook';
  starBrightness: number;
}

declare global {
  interface Window {
    __ORBITAL_SCENE__?: SceneBootPayload;
  }
}
