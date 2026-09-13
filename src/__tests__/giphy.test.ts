import { describe, expect, it } from 'vitest';
import { isGiphyFailure, toGiphyLang } from '../celebrations/giphy';

describe('toGiphyLang', () => {
  it('maps locale tags to ISO language', () => {
    expect(toGiphyLang('en_IN')).toBe('en');
    expect(toGiphyLang('pt-BR')).toBe('pt');
    expect(toGiphyLang('ja')).toBe('ja');
    expect(toGiphyLang('ko_KR')).toBe('ko');
  });
});

describe('isGiphyFailure', () => {
  it('detects failure vs success payloads', () => {
    expect(isGiphyFailure({ reason: 'api 401: Unauthorized' })).toBe(true);
    expect(isGiphyFailure({ id: 'giphy:1', url: 'https://x' })).toBe(false);
  });
});
