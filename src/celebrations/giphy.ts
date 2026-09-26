import { GiphyFetch } from '@giphy/js-fetch-api';
import * as fs from 'node:fs';
import * as https from 'node:https';
import * as path from 'node:path';
import { URL } from 'node:url';

export interface GiphyGifResult {
  id: string;
  url: string;
  /** Local cache path after download */
  fsPath?: string;
}

export interface GiphyFetchFailure {
  reason: string;
}

function httpsDownload(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const go = (u: string) => {
      https
        .get(u, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            file.close();
            go(res.headers.location);
            return;
          }
          if (res.statusCode && res.statusCode >= 400) {
            file.close();
            reject(new Error(`download HTTP ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', (err) => {
          try {
            fs.unlinkSync(dest);
          } catch {
            /* ignore */
          }
          reject(err);
        });
    };
    go(url);
  });
}

/** Map region locale tags (en_IN, pt_BR, …) to Giphy `lang` (ISO 639-1). */
export function toGiphyLang(localeOrLang: string): string {
  const raw = (localeOrLang || 'en').trim().replace(/_/g, '-');
  const base = raw.split('-')[0]?.toLowerCase() || 'en';
  return base.length === 2 || base.length === 3 ? base : 'en';
}

export function isGiphyFailure(
  value: GiphyGifResult | GiphyFetchFailure,
): value is GiphyFetchFailure {
  return Boolean(value && typeof value === 'object' && 'reason' in value && !('id' in value));
}

/**
 * Search with the installed `@giphy/js-fetch-api` package, then save the file.
 * Callers should use the cache on later celebrations instead of searching again.
 */
export async function fetchGiphyGif(opts: {
  apiKey: string;
  query: string;
  lang: string;
  excludeIds: Set<string>;
  cacheDir: string;
  random?: () => number;
}): Promise<GiphyGifResult | GiphyFetchFailure> {
  const random = opts.random ?? Math.random;
  const gf = new GiphyFetch(opts.apiKey);
  let results: Awaited<ReturnType<GiphyFetch['search']>>['data'] = [];
  try {
    const found = await gf.search(opts.query, {
      limit: 12,
      rating: 'g',
      lang: toGiphyLang(opts.lang),
      type: 'gifs',
    });
    results = found.data ?? [];
  } catch (err) {
    return { reason: `giphy package: ${err instanceof Error ? err.message : String(err)}` };
  }

  const fresh = results.filter((item) => item?.id != null && !opts.excludeIds.has(String(item.id)));
  const pool = fresh.length > 0 ? fresh : results;
  if (pool.length === 0) {
    return { reason: `empty results for "${opts.query}"` };
  }

  const pick = pool[Math.floor(random() * pool.length)];
  const id = String(pick?.id ?? '');
  const images = pick?.images;
  const gifUrl =
    images?.downsized?.url ||
    images?.downsized_medium?.url ||
    images?.fixed_height?.url ||
    images?.original?.url;
  if (!id || !gifUrl) {
    return { reason: 'result missing gif url' };
  }

  fs.mkdirSync(opts.cacheDir, { recursive: true });
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'gif';
  const dest = path.join(opts.cacheDir, `${safe}.gif`);
  if (!fs.existsSync(dest)) {
    try {
      await httpsDownload(gifUrl, dest);
    } catch (err) {
      return { reason: `download: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
  return { id: `giphy:${id}`, url: gifUrl, fsPath: dest };
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
