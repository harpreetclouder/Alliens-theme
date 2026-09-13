# Acid Scrapbook Pack — Design

**Date:** 2026-09-07  
**Status:** Approved (theme + celebrations + continuous motion)  
**Scope:** New fifth Orbital pack — theme + celebration family. Not a rewrite of mothership/glitch/soft/root.

## Goal

Add a Pinterest-core pack that feels **out of traditional IDE themes** while celebrations play as **one continuous modern animation** (camera arc, easing, parallax) — scrapbook *identity*, not old-school stampy fashion motion.

## Pack identity

| Field | Value |
|-------|--------|
| Pack id | `acid` |
| Label | Acid Scrapbook |
| Theme | `Orbital — Acid Scrapbook` |
| Theme file | `themes/acid-scrapbook-color-theme.json` |
| Tint (primary) | `#d6ff3c` (lime) |
| Secondary flash | `#ff2d95` (magenta) — soft pulse wash, not hard flash |
| SFX | `media/sfx/acid.wav` — short peel / paper-flutter (~0.5–0.8s) |

## Palette (theme)

| Role | Hex | Use |
|------|-----|-----|
| Canvas | `#0c0a0f` | editor, sidebar, title bar |
| Foreground | `#fff6e8` | cream paper text |
| Lime | `#d6ff3c` | keywords, focus, active accents |
| Magenta | `#ff2d95` | strings, status bar bg |
| Cyan | `#5ef2ff` | functions / links |
| Dim | `#6b6570` | comments |

### UI beats

- Status bar: magenta background, cream foreground
- Activity bar: canvas ink; active icon lime
- Selection / find match: lime wash ~20%
- Active tab / focus border: lime
- Readable first — no rainbow-every-token

## Celebrations

### Surfaces (unchanged product rules)

- Tests / preview → terminal (alt-screen), continuous animation
- Commit / build / debug → panel (overlay on hype big wins)
- Chill intensity → status bar whisper

### Copy & emoji

- Hero / orbit pool: `📒` `✂️` `📌` `✨` `🧃` `💥` `🌟`
- Caption tone: sticker energy, short, uppercase-friendly  
  Examples: `TESTS ✓ STICKERED`, `COMMIT · PEEL & SHIP`, `ALL GREEN · COLLAGE COMPLETE`
- Sublines: `scrapbook says: iconic`, `pinned to the mood board`, `chaos: curated`

### Motion model (continuous — required)

**One scene, one arc** over ~5s:

1. **Enter** — soft zoom + parallax (bg wash → mid pins → hero caption); ease-out
2. **Hold** — orbit pins drift on a smooth loop; caption fully readable; magenta as soft ambient pulse
3. **Exit** — reverse ease (zoom out / fade); same continuity as enter

**Hard rules**

- Continuous timelines with ease-in-out; no hard cuts
- Caption slides / types with soft trail — **not** a stamp pop
- Orbit emojis interpolate positions — **not** jump between discrete slots
- Progress = easing ribbon fill — **not** blocky stepped bar
- Magenta = soft pulse wash — **not** flashbang
- `reduceMotion: always` → single static frame (no loop)

### Terminal (`scripts/terminal-celebration.mjs`)

- Include `acid` pack entry (tint RGB from lime, captions, emojis)
- Target ~20–30fps with interpolated drift for pins / hero
- Stagger opacity + position over the full duration (one continuous arc)
- Streak line uses magenta accent when streak > 1

### Panel / overlay

- Pack-specific CSS loop class (e.g. `loop-acid`) — continuous sticker/collage drift, not stamp stamps
- **GIFs in scope for v1** under `media/gifs/acid/` (2–3 short loops) used as celebration hero icons/visuals — same picker path as other packs (`gifs.ts` + continuous scene wrapper)
- Webview uses existing duration / exit-lead; scene-in → hold → scene-out
- Fallback: CSS `loop-acid` if a GIF file is missing

### Icons vs GIFs

| Surface | Animated GIF? |
|---------|----------------|
| Celebration panel / overlay hero | **Yes** — primary “icon” moment |
| Terminal celebration | No (ANSI + emoji only) |
| Activity bar / file icons / theme chrome | No — static SVG/PNG only (editor limitation) |

### SFX

- Extend `scripts/generate-sfx.mjs` with an `acid` generator (paper flutter + soft click)
- Registry points `sfxFile: 'acid.wav'`

## Code touchpoints

1. `src/packs/types.ts` — add `'acid'` to `PackId`
2. `src/packs/registry.ts` — pack definition + tint
3. `themes/acid-scrapbook-color-theme.json` — full theme
4. `package.json` — theme contribute, pack enum, Switch Pack labels
5. `src/commands/registerCommands.ts` — theme label map
6. `src/celebrations/captions.ts` — acid lines/sublines
7. `src/celebrations/visuals.ts` / `loops.ts` / `gifs.ts` — acid loop (and optional gif)
8. `media/webview/celebration.css` — `loop-acid` continuous keyframes
9. `scripts/terminal-celebration.mjs` — acid pack + smoother motion
10. `scripts/generate-sfx.mjs` — acid.wav
11. Tests: registry, captions, settings pack fallback

## Non-goals

- Replacing or restyling mothership / glitch / soft / root
- Changing default pack (still mothership unless user switches)
- Animating activity-bar / file icons (not supported by the IDE)
- Old-school fashion stamp / collage-cut transitions

## Success criteria

1. User can **Orbital: Switch Pack** → Acid Scrapbook and get theme + tint + captions + SFX.
2. Theme looks unlike standard dark neon IDE themes (lime + magenta scrapbook).
3. Terminal and panel celebrations feel like **one continuous animation**, not discrete stamp frames.
4. Existing packs and layered surfaces (terminal / panel / statusbar) keep working.
5. Vitest + compile pass; VSIX builds.

## Open follow-ups (optional later)

- More acid GIF variants beyond the initial 2–3
- First-run highlight / onboarding callout for Acid Scrapbook
