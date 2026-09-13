import * as fs from 'node:fs';
import { PackId } from '../packs/types';
import { WinKind } from './types';

export type BiteTone = 'joke' | 'satire' | 'hype' | 'wholesome';

export type AnimFlavor =
  | 'glitch-text'
  | 'typewriter'
  | 'bounce-in'
  | 'stamp-spin'
  | 'slide-up'
  | 'confetti'
  | 'pulse-zoom'
  | 'float-soft';

export interface ContentBite {
  id: string;
  kinds: Array<WinKind | '*'>;
  packs: Array<PackId | '*'>;
  tone: BiteTone;
  anim?: AnimFlavor;
  line: string;
  subline?: string;
}

export interface BitesFile {
  version: number;
  bites: ContentBite[];
  anims?: AnimFlavor[];
}

const DEFAULT_ANIMS: AnimFlavor[] = [
  'glitch-text',
  'typewriter',
  'bounce-in',
  'stamp-spin',
  'slide-up',
  'confetti',
  'pulse-zoom',
  'float-soft',
];

function matchesKind(bite: ContentBite, kind: WinKind): boolean {
  return bite.kinds.includes('*') || bite.kinds.includes(kind);
}

function matchesPack(bite: ContentBite, pack: PackId): boolean {
  return bite.packs.includes('*') || bite.packs.includes(pack);
}

export class ContentLibrary {
  constructor(
    private readonly bites: ContentBite[],
    private readonly anims: AnimFlavor[] = DEFAULT_ANIMS,
  ) {}

  static empty(): ContentLibrary {
    return new ContentLibrary([]);
  }

  static fromJson(parsed: BitesFile): ContentLibrary {
    const bites = Array.isArray(parsed.bites) ? parsed.bites : [];
    const anims =
      Array.isArray(parsed.anims) && parsed.anims.length > 0
        ? parsed.anims
        : DEFAULT_ANIMS;
    return new ContentLibrary(bites, anims);
  }

  static loadFromFile(filePath: string): ContentLibrary {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return ContentLibrary.fromJson(JSON.parse(raw) as BitesFile);
    } catch {
      return ContentLibrary.empty();
    }
  }

  get size(): number {
    return this.bites.length;
  }

  candidates(kind: WinKind, pack: PackId): ContentBite[] {
    return this.bites.filter((b) => matchesKind(b, kind) && matchesPack(b, pack));
  }

  pickBite(
    kind: WinKind,
    pack: PackId,
    random: () => number = Math.random,
    excludeIds: ReadonlySet<string> = new Set(),
  ): ContentBite | undefined {
    const all = this.candidates(kind, pack);
    const fresh = all.filter((b) => !excludeIds.has(b.id));
    const pool = fresh.length > 0 ? fresh : all;
    if (pool.length === 0) {
      return undefined;
    }
    return pool[Math.floor(random() * pool.length)];
  }

  /** Prefer random anim even when bite suggests one (~50%). */
  pickAnim(preferred?: AnimFlavor, random: () => number = Math.random): AnimFlavor {
    if (preferred && this.anims.includes(preferred) && random() < 0.5) {
      return preferred;
    }
    return this.anims[Math.floor(random() * this.anims.length)] ?? 'bounce-in';
  }
}
