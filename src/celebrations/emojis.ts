import { PackId } from '../packs/types';

/** @deprecated use pickEmojis — kept for backwards compat in tests */
export const PACK_EMOJI: Record<PackId, string> = {
  mothership: '👽',
  glitch: '👾',
  soft: '🛸',
  root: '💻',
  acid: '📒',
};

export const PACK_EMOJI_POOL: Record<PackId, readonly string[]> = {
  mothership: ['👽', '🛸', '🌌', '⭐', '🔭', '🪐', '🚀', '👾'],
  glitch: ['👾', '📺', '⚡', '💾', '🎮', '🌀', '📼', '🔊'],
  soft: ['🛸', '🐄', '☁️', '✨', '🌙', '💫', '🌸', '🫧'],
  root: ['💻', '🖥️', '🔓', '⚙️', '🐛', '🧬', '⌨️', '🛡️'],
  acid: ['📒', '✂️', '📌', '✨', '🧃', '💥', '🌟', '📎'],
};

export interface PickedEmojis {
  hero: string;
  orbit: [string, string, string];
}

function shufflePool(pool: readonly string[], random: () => number): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function pickEmojis(
  pack: PackId,
  random: () => number = Math.random,
): PickedEmojis {
  const shuffled = shufflePool(PACK_EMOJI_POOL[pack], random);
  const hero = shuffled[0] ?? PACK_EMOJI[pack];
  const orbit = shuffled.slice(1, 4) as [string, string, string];
  while (orbit.length < 3) {
    orbit.push(PACK_EMOJI[pack]);
  }
  return { hero, orbit };
}
