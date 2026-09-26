# Work Progress — Orbital

## Status
**v0.0.39** — celebrations show a drawn pack GIF instead of a blank or "content not available" frame

## GIF
Most pack files were the same Giphy unavailable placeholder. They are replaced with generated pack loops. A remote Giphy URL is not shown until the file is on disk. `npm run verify:gif` opens the celebration in Chromium and fails if the hero image is blank or still that placeholder.

## Evidence
150 tests. GIF harness PASS: mothership saucer painted 160×96, broken URL falls back to a visible tint.


## GIF
Giphy is used only when the file is already on disk. Otherwise the pack GIF shows. A failed image swaps to a tinted fallback instead of an empty box.

## Harness
`npm run verify:gif` opens the celebration in Chromium (Playwright), checks the hero GIF has real pixels, and checks a dead URL still leaves a visible fallback. Part of packaging and `verify:release`.
