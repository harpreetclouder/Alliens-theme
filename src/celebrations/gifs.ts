import { PackId } from '../packs/types';

export interface GifDef {
  id: string;
  pack: PackId;
  /** Path relative to `media/gifs/` */
  file: string;
}

export const GIFS: GifDef[] = [
  { id: 'mothership-ufo-beam', pack: 'mothership', file: 'mothership/ufo-beam.gif' },
  { id: 'mothership-alien-wave', pack: 'mothership', file: 'mothership/alien-wave.gif' },
  { id: 'mothership-saucer-lift', pack: 'mothership', file: 'mothership/saucer-lift.gif' },
  { id: 'glitch-static-burst', pack: 'glitch', file: 'glitch/static-burst.gif' },
  { id: 'glitch-pixel-glitch', pack: 'glitch', file: 'glitch/pixel-glitch.gif' },
  { id: 'glitch-vhs-tracking', pack: 'glitch', file: 'glitch/vhs-tracking.gif' },
  { id: 'soft-floating-ufo', pack: 'soft', file: 'soft/floating-ufo.gif' },
  { id: 'soft-sparkle-drift', pack: 'soft', file: 'soft/sparkle-drift.gif' },
  { id: 'soft-cozy-stars', pack: 'soft', file: 'soft/cozy-stars.gif' },
  { id: 'root-matrix-rain', pack: 'root', file: 'root/matrix-rain.gif' },
  { id: 'root-hacker-pulse', pack: 'root', file: 'root/hacker-pulse.gif' },
  { id: 'root-shell-access', pack: 'root', file: 'root/shell-access.gif' },
];

export function pickGif(
  pack: PackId,
  random: () => number = Math.random,
): GifDef | undefined {
  const pool = GIFS.filter((g) => g.pack === pack);
  if (pool.length === 0) {
    return undefined;
  }
  return pool[Math.floor(random() * pool.length)]!;
}
