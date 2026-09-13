import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pickJoyGif } from '../celebrations/contentBrain';
import {
  loadRegionsFile,
  pickRegionQuery,
  resolveRegion,
} from '../celebrations/region';

const regionsPath = path.join(__dirname, '../../media/content/regions.json');

describe('resolveRegion', () => {
  const data = loadRegionsFile(regionsPath);

  it('maps en-IN language to India', () => {
    expect(resolveRegion({ language: 'en-IN', timeZone: 'UTC', data })).toBe('in');
  });

  it('maps Asia/Kolkata timezone when language is plain en', () => {
    expect(resolveRegion({ language: 'en', timeZone: 'Asia/Kolkata', data })).toBe('in');
  });

  it('maps pt-BR to Brazil', () => {
    expect(resolveRegion({ language: 'pt-BR', data })).toBe('br');
  });

  it('maps ja to Japan', () => {
    expect(resolveRegion({ language: 'ja', data })).toBe('jp');
  });

  it('honors override over language', () => {
    expect(
      resolveRegion({ language: 'en-US', override: 'in', data }),
    ).toBe('in');
  });

  it('falls back to global for unknown', () => {
    expect(resolveRegion({ language: 'xx', timeZone: 'Etc/UTC', data })).toBe('global');
  });
});

describe('pickRegionQuery', () => {
  const data = loadRegionsFile(regionsPath);

  it('returns a query string for India tests', () => {
    const q = pickRegionQuery('in', 'tests', () => 0, data);
    expect(q.length).toBeGreaterThan(3);
  });
});

describe('pickJoyGif', () => {
  it('biases local gifs and records region', async () => {
    const pick = await pickJoyGif({
      pack: 'acid',
      kind: 'preview',
      language: 'en-IN',
      timeZone: 'Asia/Kolkata',
      regionsPath,
      giphyCacheDir: path.join(__dirname, '../../.tmp-giphy-test'),
      recentGifIds: [],
      random: () => 0.2,
    });
    expect(pick.region).toBe('in');
    expect(pick.gif?.id).toBeTruthy();
    expect(pick.source === 'local-region' || pick.source === 'local-pack').toBe(true);
  });

  it('avoids recent gif ids when alternatives exist', async () => {
    const first = await pickJoyGif({
      pack: 'mothership',
      kind: 'preview',
      language: 'en-US',
      regionsPath,
      giphyCacheDir: path.join(__dirname, '../../.tmp-giphy-test'),
      recentGifIds: [],
      random: () => 0.99,
    });
    const second = await pickJoyGif({
      pack: 'mothership',
      kind: 'preview',
      language: 'en-US',
      regionsPath,
      giphyCacheDir: path.join(__dirname, '../../.tmp-giphy-test'),
      recentGifIds: first.gif ? [first.gif.id] : [],
      random: () => 0.99,
    });
    if (first.gif && second.gif) {
      expect(second.gif.id).not.toBe(first.gif.id);
    }
  });
});
