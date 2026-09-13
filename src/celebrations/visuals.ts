import { PackId } from '../packs/types';
import { pickEmojis, PickedEmojis } from './emojis';
import { GifDef, pickGif } from './gifs';
import { LoopDef } from './loops';
import { pickLoop } from './picker';

export interface CelebrationVisual {
  emojis: PickedEmojis;
  loop: LoopDef;
  gif?: GifDef;
}

/** Overlay leans GIF; cinematic surfaces (panel/overlay) also lean GIF; toast keeps CSS loops. */
export function pickCelebrationVisual(
  pack: PackId,
  mode: 'toast' | 'overlay',
  random: () => number = Math.random,
  cinematic = false,
): CelebrationVisual {
  const emojis = pickEmojis(pack, random);
  const loop = pickLoop(pack, random);
  const useGif = (mode === 'overlay' || cinematic) && random() < 0.72;
  const gif = useGif ? pickGif(pack, random) : undefined;
  return { emojis, loop, gif };
}
