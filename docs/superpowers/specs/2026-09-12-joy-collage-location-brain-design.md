# Joy Collage + Location Brain — Design

**Date:** 2026-09-12  
**Status:** Approved (hybrid A + meme collage B)  
**Scope:** Replace neon WebGL-first overlay/panel with a joy collage; add locale-aware Content Brain + optional Giphy (Tenor shut down 2026); project skill for curation.

## Goal

Celebrations should feel like a **stress-buster meme board**: big GIF, stickers, punchline card — funny and encouraging. Media should **vary** and lean toward what people in the user’s **locale region** find familiar. No GPS.

## Location model (privacy-safe)

Resolve `RegionId` from:

1. `vscode.env.language` country/script (`en-IN` → `in`, `pt-BR` → `br`, `ja` → `jp`)
2. Else `Intl` timezone (`Asia/Kolkata` → `in`, `Europe/London` → `uk`, `America/*` → `us`, …)
3. Else `global`

Optional setting `orbital.joy.region` override (`auto` | region id).

Never use GPS or IP geolocation.

## Smart pick order

1. Local GIF not in recent window, biased to region’s `localGifBias`
2. Any unused pack GIF (always prefer a GIF on collage surfaces)
3. If `orbital.giphy.apiKey` set → prefer Giphy search (~70%) with region `giphyLang` + mood query; cache to `globalStorage/giphy-cache/`; no-repeat by Giphy id. (Tenor API shut down June 2026 — do not use.)
4. Fallback: any pack GIF / CSS loop

Recent windows: bites (12), gif ids (16).

## Collage UI

Overlay + panel: paper wash, tilted hero GIF, sticker chips, joke card. No neon grid/torus. Soft drift ~9s. reduceMotion → static.

Terminal / statusbar unchanged.

## Skill

`.cursor/skills/orbital-joy-brain/` — expand regional packs, safe humor rules, Giphy query tags, diversity.

## Out of scope

GPS/IP geo; CDN scripts in webview; NSFW; neon scene as default.
