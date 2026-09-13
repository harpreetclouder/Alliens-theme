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

function httpsGetJson(url: string): Promise<{ statusCode: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGetJson(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ statusCode: res.statusCode ?? 0, body: JSON.parse(text) });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Giphy timeout'));
    });
  });
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
 * Search Giphy REST with an SDK or API key from the developer dashboard.
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
  const params = new URLSearchParams({
    api_key: opts.apiKey,
    q: opts.query,
    limit: '12',
    rating: 'g',
    lang: toGiphyLang(opts.lang),
  });
  const endpoint = `https://api.giphy.com/v1/gifs/search?${params.toString()}`;

  let statusCode = 0;
  let json: any;
  try {
    const res = await httpsGetJson(endpoint);
    statusCode = res.statusCode;
    json = res.body;
  } catch (err) {
    return { reason: `network: ${err instanceof Error ? err.message : String(err)}` };
  }

  const metaStatus = Number(json?.meta?.status ?? statusCode);
  if (metaStatus >= 400 || statusCode >= 400) {
    const msg = json?.meta?.msg || `HTTP ${statusCode || metaStatus}`;
    return { reason: `api ${metaStatus}: ${msg}` };
  }

  const results: any[] = Array.isArray(json?.data) ? json.data : [];
  const fresh = results.filter((r) => r?.id && !opts.excludeIds.has(String(r.id)));
  const pool = fresh.length > 0 ? fresh : results;
  if (pool.length === 0) {
    return { reason: `empty results for "${opts.query}"` };
  }

  const pick = pool[Math.floor(random() * pool.length)];
  const id = String(pick.id);
  const images = pick.images || {};
  const gifUrl =
    images.downsized?.url ||
    images.downsized_medium?.url ||
    images.fixed_height?.url ||
    images.original?.url;

  if (!gifUrl || typeof gifUrl !== 'string') {
    return { reason: 'result missing gif url' };
  }

  fs.mkdirSync(opts.cacheDir, { recursive: true });
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'gif';
  const dest = path.join(opts.cacheDir, `${safe}.gif`);

  try {
    if (!fs.existsSync(dest)) {
      await httpsDownload(gifUrl, dest);
    }
    return { id: `giphy:${id}`, url: gifUrl, fsPath: dest };
  } catch {
    return { id: `giphy:${id}`, url: gifUrl };
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
