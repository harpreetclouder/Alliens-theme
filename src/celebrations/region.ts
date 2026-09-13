import * as fs from 'node:fs';
import * as path from 'node:path';

export type RegionId =
  | 'global'
  | 'us'
  | 'uk'
  | 'in'
  | 'br'
  | 'jp'
  | 'kr'
  | 'de'
  | 'fr'
  | 'es'
  | 'mx'
  | 'au';

export interface RegionDef {
  label: string;
  /** Giphy search lang (ISO 639-1), e.g. en, hi, pt, ja */
  giphyLang: string;
  /** @deprecated kept for older regions.json — mapped to giphyLang */
  tenorLocale?: string;
  localGifBias: string[];
  queries: Record<string, string[]>;
}

export interface RegionsFile {
  regions: Record<string, RegionDef>;
  languageToRegion: Record<string, string>;
  timezoneToRegion: Record<string, string>;
}

const FALLBACK: RegionsFile = {
  regions: {
    global: {
      label: 'Global',
      giphyLang: 'en',
      localGifBias: ['acid/', 'soft/', 'mothership/'],
      queries: {
        preview: ['celebration funny', 'happy dance'],
        tests: ['coding celebration'],
        commit: ['ship it funny'],
        build: ['success celebration'],
        debug: ['relieved funny'],
        save: ['nice job'],
      },
    },
  },
  languageToRegion: {},
  timezoneToRegion: {},
};

let cached: RegionsFile | undefined;

export function loadRegionsFile(fsPath: string): RegionsFile {
  try {
    const raw = JSON.parse(fs.readFileSync(fsPath, 'utf8')) as RegionsFile;
    if (!raw.regions || !raw.regions.global) {
      return FALLBACK;
    }
    cached = raw;
    return raw;
  } catch {
    return FALLBACK;
  }
}

export function getRegionsData(extensionRoot?: string): RegionsFile {
  if (cached) {
    return cached;
  }
  if (extensionRoot) {
    return loadRegionsFile(path.join(extensionRoot, 'media', 'content', 'regions.json'));
  }
  return FALLBACK;
}

/** Normalize BCP-47 / VS Code language to lookup keys. */
export function languageCandidates(language: string): string[] {
  const raw = (language || 'en').trim().replace(/_/g, '-');
  const lower = raw.toLowerCase();
  const parts = lower.split('-');
  const out = new Set<string>([lower, parts[0]!]);
  if (parts.length >= 2) {
    out.add(`${parts[0]}-${parts[1]!.toUpperCase()}`);
    out.add(`${parts[0]}-${parts[1]}`);
  }
  return [...out];
}

/**
 * Smart locale → region. Language country wins; else timezone; else global.
 * `override` when not auto/empty forces a region.
 */
export function resolveRegion(opts: {
  language: string;
  timeZone?: string;
  override?: string;
  data?: RegionsFile;
}): RegionId {
  const data = opts.data ?? cached ?? FALLBACK;
  const override = (opts.override || 'auto').trim().toLowerCase();
  if (override && override !== 'auto' && data.regions[override]) {
    return override as RegionId;
  }

  for (const key of languageCandidates(opts.language)) {
    const variants = [
      key,
      key.toLowerCase(),
      key.replace(/-([a-z]{2})$/i, (_, c: string) => `-${c.toUpperCase()}`),
    ];
    for (const v of variants) {
      const hit = data.languageToRegion[v];
      if (hit && data.regions[hit]) {
        return hit as RegionId;
      }
    }
  }

  // en-IN style: take region subtag when present
  const m = opts.language.trim().replace(/_/g, '-').match(/^[a-z]{2,3}-([a-z]{2})/i);
  if (m) {
    const cc = m[1]!.toLowerCase();
    const map: Record<string, RegionId> = {
      in: 'in',
      gb: 'uk',
      uk: 'uk',
      us: 'us',
      au: 'au',
      br: 'br',
      jp: 'jp',
      kr: 'kr',
      de: 'de',
      fr: 'fr',
      es: 'es',
      mx: 'mx',
    };
    if (map[cc] && data.regions[map[cc]!]) {
      return map[cc]!;
    }
  }

  const tz = opts.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const tzHit = data.timezoneToRegion[tz];
  if (tzHit && data.regions[tzHit]) {
    return tzHit as RegionId;
  }

  if (tz.startsWith('America/')) {
    return data.regions.us ? 'us' : 'global';
  }
  if (tz.startsWith('Europe/')) {
    return data.regions.uk ? 'uk' : 'global';
  }
  if (tz.startsWith('Asia/')) {
    return 'global';
  }

  return 'global';
}

export function getRegionDef(region: RegionId, data?: RegionsFile): RegionDef {
  const d = data ?? cached ?? FALLBACK;
  const raw = d.regions[region] ?? d.regions.global!;
  const giphyLang =
    raw.giphyLang ||
    (raw.tenorLocale ? raw.tenorLocale.split(/[_-]/)[0]!.toLowerCase() : 'en');
  return { ...raw, giphyLang };
}

export function pickRegionQuery(
  region: RegionId,
  kind: string,
  random: () => number = Math.random,
  data?: RegionsFile,
): string {
  const def = getRegionDef(region, data);
  const list = def.queries[kind] ?? def.queries.preview ?? ['celebration funny'];
  return list[Math.floor(random() * list.length)] ?? list[0]!;
}
