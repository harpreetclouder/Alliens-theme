# Acid Scrapbook Pack — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add fifth pack `acid` (theme + celebrations + continuous motion + GIFs + SFX).

**Architecture:** Extend existing pack registry, captions, loops, gifs, terminal script, and SFX generator. New theme JSON + CSS continuous `loop-acid-*` keyframes. GIFs under `media/gifs/acid/`.

**Tech Stack:** TypeScript extension, CSS webview, Node scripts for SFX/GIF generation.

---

### Task 1: Pack id + registry + tests
- [ ] Add `'acid'` to `PackId`, registry entry, settings enum, commands theme label
- [ ] Registry test expects 5 packs

### Task 2: Color theme
- [ ] Create `themes/acid-scrapbook-color-theme.json`
- [ ] Contribute in `package.json`

### Task 3: Captions + emojis + loops + CSS
- [ ] Acid captions/sublines in `captions.ts`
- [ ] Emoji pool in `emojis.ts`
- [ ] 3 pack loops in `loops.ts` + continuous CSS in `celebration.css`

### Task 4: GIFs + SFX
- [ ] Generate 3 acid GIFs → `media/gifs/acid/`
- [ ] Register in `gifs.ts`
- [ ] Generate `acid.wav` via `generate-sfx.mjs`

### Task 5: Terminal continuous motion + acid
- [ ] Add acid pack to `terminal-celebration.mjs`
- [ ] Smooth interpolate drift (~20–30fps), easing progress ribbon

### Task 6: Version, package, progress
- [ ] Bump to 0.0.18, update WORK_PROGRESS.md
- [ ] Compile + test + package VSIX
