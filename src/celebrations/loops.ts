import { PackId } from '../packs/types';

export type LoopId = string;

export interface LoopDef {
  id: LoopId;
  kind: 'pack' | 'library';
  pack?: PackId;
  cssClass: string;
}

export const LOOPS: LoopDef[] = [
  // mothership pack (3)
  { id: 'mothership-beam', kind: 'pack', pack: 'mothership', cssClass: 'loop-mothership-beam' },
  { id: 'mothership-tractor', kind: 'pack', pack: 'mothership', cssClass: 'loop-mothership-tractor' },
  { id: 'mothership-saucer', kind: 'pack', pack: 'mothership', cssClass: 'loop-mothership-saucer' },
  // glitch pack (3)
  { id: 'glitch-stamp', kind: 'pack', pack: 'glitch', cssClass: 'loop-glitch-stamp' },
  { id: 'glitch-yeeted', kind: 'pack', pack: 'glitch', cssClass: 'loop-glitch-yeeted' },
  { id: 'glitch-shipped', kind: 'pack', pack: 'glitch', cssClass: 'loop-glitch-shipped' },
  // soft pack (3)
  { id: 'soft-cow', kind: 'pack', pack: 'soft', cssClass: 'loop-soft-cow' },
  { id: 'soft-orb', kind: 'pack', pack: 'soft', cssClass: 'loop-soft-orb' },
  { id: 'soft-float', kind: 'pack', pack: 'soft', cssClass: 'loop-soft-float' },
  // root pack (3)
  { id: 'root-sudo', kind: 'pack', pack: 'root', cssClass: 'loop-root-sudo' },
  { id: 'root-shell', kind: 'pack', pack: 'root', cssClass: 'loop-root-shell' },
  { id: 'root-ascii', kind: 'pack', pack: 'root', cssClass: 'loop-root-ascii' },
  // acid pack (3) — continuous drift, not stamp pops
  { id: 'acid-peel', kind: 'pack', pack: 'acid', cssClass: 'loop-acid-peel' },
  { id: 'acid-pin', kind: 'pack', pack: 'acid', cssClass: 'loop-acid-pin' },
  { id: 'acid-collage', kind: 'pack', pack: 'acid', cssClass: 'loop-acid-collage' },
  // library (12)
  { id: 'lib-wink', kind: 'library', cssClass: 'loop-lib-wink' },
  { id: 'lib-liftoff', kind: 'library', cssClass: 'loop-lib-liftoff' },
  { id: 'lib-signal', kind: 'library', cssClass: 'loop-lib-signal' },
  { id: 'lib-shipped', kind: 'library', cssClass: 'loop-lib-shipped' },
  { id: 'lib-pwned', kind: 'library', cssClass: 'loop-lib-pwned' },
  { id: 'lib-radar', kind: 'library', cssClass: 'loop-lib-radar' },
  { id: 'lib-orbit', kind: 'library', cssClass: 'loop-lib-orbit' },
  { id: 'lib-zap', kind: 'library', cssClass: 'loop-lib-zap' },
  { id: 'lib-wave', kind: 'library', cssClass: 'loop-lib-wave' },
  { id: 'lib-spark', kind: 'library', cssClass: 'loop-lib-spark' },
  { id: 'lib-dock', kind: 'library', cssClass: 'loop-lib-dock' },
  { id: 'lib-ping', kind: 'library', cssClass: 'loop-lib-ping' },
];
