import { PackId } from '../packs/types';
import { GIFS, GifDef } from './gifs';
import { fetchGiphyGif, isGiphyFailure } from './giphy';
import {
  getRegionDef,
  getRegionsData,
  loadRegionsFile,
  pickRegionQuery,
  RegionId,
  resolveRegion,
} from './region';
import { WinKind } from './types';

export interface BrainGifPick {
  gif?: GifDef & { absoluteFsPath?: string; remoteUrl?: string };
  region: RegionId;
  source: 'local-region' | 'local-pack' | 'giphy' | 'none';
  query?: string;
  /** Why live Giphy was skipped / failed (for Output channel). */
  detail?: string;
}

export interface ContentBrainOpts {
  pack: PackId;
  kind: WinKind;
  language: string;
  timeZone?: string;
  regionOverride?: string;
  giphySdkKey?: string;
  regionsPath: string;
  giphyCacheDir: string;
  recentGifIds: string[];
  random?: () => number;
}

function scoreLocalGif(file: string, bias: string[]): number {
  for (let i = 0; i < bias.length; i++) {
    if (file.startsWith(bias[i]!)) {
      return bias.length - i;
    }
  }
  return 0;
}

function pickWeighted<T>(items: T[], weight: (item: T) => number, random: () => number): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  const weights = items.map((item) => Math.max(0.15, weight(item)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

function pickLocal(
  opts: ContentBrainOpts,
  region: RegionId,
  def: ReturnType<typeof getRegionDef>,
  random: () => number,
  detail?: string,
): BrainGifPick {
  const exclude = new Set(opts.recentGifIds);
  const packPool = GIFS.filter((g) => g.pack === opts.pack);
  const allLocal = packPool.length > 0 ? packPool : GIFS;
  const freshLocal = allLocal.filter((g) => !exclude.has(g.id));
  const localPool = freshLocal.length > 0 ? freshLocal : allLocal;

  const regional = pickWeighted(
    localPool,
    (g) => scoreLocalGif(g.file, def.localGifBias) + (g.pack === opts.pack ? 2 : 0),
    random,
  );

  if (regional) {
    const biased = scoreLocalGif(regional.file, def.localGifBias) > 0;
    return {
      gif: regional,
      region,
      source: biased ? 'local-region' : 'local-pack',
      detail,
    };
  }

  const fallback = allLocal[Math.floor(random() * allLocal.length)];
  return {
    gif: fallback,
    region,
    source: fallback ? 'local-pack' : 'none',
    detail,
  };
}

/**
 * With Giphy SDK key: always try live search first, then local fallback.
 * Without key → local only.
 */
export async function pickJoyGif(opts: ContentBrainOpts): Promise<BrainGifPick> {
  const random = opts.random ?? Math.random;
  const data = loadRegionsFile(opts.regionsPath);
  getRegionsData();
  const region = resolveRegion({
    language: opts.language,
    timeZone: opts.timeZone,
    override: opts.regionOverride,
    data,
  });
  const def = getRegionDef(region, data);
  const key = opts.giphySdkKey?.trim() ?? '';

  if (!key) {
    return pickLocal(opts, region, def, random, 'no giphy.sdkKey / giphy.apiKey');
  }

  const query = pickRegionQuery(region, opts.kind, random, data);
  const exclude = new Set(opts.recentGifIds);
  const result = await fetchGiphyGif({
    apiKey: key,
    query,
    lang: def.giphyLang,
    excludeIds: new Set(
      [...exclude].map((id) => id.replace(/^giphy:/, '').replace(/^tenor:/, '')),
    ),
    cacheDir: opts.giphyCacheDir,
    random,
  });

  if (isGiphyFailure(result)) {
    return pickLocal(opts, region, def, random, `giphy failed → local (${result.reason})`);
  }

  return {
    gif: {
      id: result.id,
      pack: opts.pack,
      file: '',
      absoluteFsPath: result.fsPath,
      remoteUrl: result.fsPath ? undefined : result.url,
    },
    region,
    source: 'giphy',
    query,
    detail: `giphy ok · q="${query}" · lang=${def.giphyLang}`,
  };
}
