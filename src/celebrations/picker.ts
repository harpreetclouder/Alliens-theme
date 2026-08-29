import { PackId } from '../packs/types';
import { LOOPS, LoopDef } from './loops';

export function pickLoop(pack: PackId, random: () => number = Math.random): LoopDef {
  const usePack = random() < 0.6;
  const pool = usePack
    ? LOOPS.filter((l) => l.kind === 'pack' && l.pack === pack)
    : LOOPS.filter((l) => l.kind === 'library');
  const idx = Math.floor(random() * pool.length) % pool.length;
  return pool[idx]!;
}
