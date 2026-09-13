---
name: orbital-joy-brain
description: >-
  Curates Orbital joy-collage memes and locale-aware GIF/caption libraries.
  Use when expanding media/content/regions.json, bites, pack GIFs, Giphy query
  tags, no-repeat rules, or international engineer humor for celebrations.
---

# Orbital Joy Brain

## Purpose

Keep Orbital celebrations **funny, encouraging, and region-aware** without neon cyber spam. Users should see varied GIFs/memes that feel familiar for their locale (language + timezone — never GPS).

## When to apply

- User asks for more memes, GIFs, jokes, regional humor, Giphy tags, or collage polish
- Editing `media/content/regions.json`, `media/content/bites.json`, `media/gifs/`, or Content Brain code
- Avoiding repeat GIFs / stale US-only humor

## Location rules

1. Prefer `vscode.env.language` country (`en-IN` → `in`)
2. Else timezone → region (`Asia/Kolkata` → `in`)
3. Else `global`
4. Honor `orbital.joy.region` override when not `auto`
5. Never invent GPS/IP geolocation

## Content rules

- Stress-buster: laugh, relief, encouragement — not mean, political, NSFW, or shocking
- International: add region entries with `giphyLang`, mood queries, `localGifBias`
- Diversity: gif no-repeat ≥16; bite no-repeat ≥12
- Hybrid: local when no key; with `orbital.giphy.sdkKey` prefer live Giphy (~70%) then local
- **Tenor API is dead** (shut down June 2026) — never add Tenor; use Giphy SDK/API key only
- Cache downloads under globalStorage `giphy-cache`
- Collage UX: hero GIF + stickers + joke card; show **Powered by GIPHY** when live GIF used
- Production keys: user upgrades in Giphy dashboard; beta keys are rate-limited (~100/hr)

## Workflows

### Add a region

1. Add id to `media/content/regions.json` with label, giphyLang, queries per win kind, localGifBias
2. Add tests in `src/__tests__/region.test.ts` for language/timezone mapping
3. Optionally tag bites with `"regions": ["in","global"]`

### Expand GIFs

1. Add files under `media/gifs/<pack>/`
2. Register in `src/celebrations/gifs.ts`
3. Update region `localGifBias` prefixes if culturally fitting

### Expand jokes

1. Prefer `npm run generate:bites` or edit `bites.json`
2. Keep engineer-safe satire; mark regions when culturally specific
3. Run tests

### Giphy SDK key

- Dashboard: https://developers.giphy.com/dashboard/
- Create App → choose **SDK** (or API) → copy key into `orbital.giphy.sdkKey`
- Upgrade to Production in dashboard for full rate limits (requires attribution — Orbital shows Powered by GIPHY)
- Mood queries stay in `regions.json`; rating=`g`

## Do not

- Ship neon grid as the default joy surface
- Integrate Tenor (discontinued)
- Repeat the same 3 GIFs without no-repeat logic
- Pull remote GIFs without cache + CSP-safe local file when possible
- Add NSFW or harassment humor
