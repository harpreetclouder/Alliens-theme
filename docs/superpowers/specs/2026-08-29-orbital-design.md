# Orbital — Design Spec

**Date:** 2026-08-29  
**Status:** Draft for review  
**Product:** Orbital — Gen Z alien/UFO coding companion for Cursor & VS Code

## 1. Problem & goal

Coders want more than a color theme. Orbital should make the editor feel alive: alien-pack aesthetics plus short, smile-first celebrations when real daily work succeeds — so opening the tool feels rewarding, not flat.

**v1 success:** Install → pick a pack → code normally → get a quick smile on real wins without spam → want to come back tomorrow.

## 2. Product shape (v1)

Single **VS Code / Cursor extension** (one `.vsix`, one install):

| Piece | Behavior |
|---|---|
| Themes | 4 selectable color themes (packs) |
| Celebrations | Pack-matched loops + shared random smile library |
| Display | Corner toast by default; full overlay for big wins |
| Triggers | Configurable; sensible defaults for daily developer wins |
| Sound | Optional per-pack vibe SFX |
| Settings / commands | Pack switch, preview, toggles, intensity, reduce-motion |

**Explicitly out of v1:** mini coding game, 2-hour joke drip, JetBrains/Neovim ports, accounts/network backend, large raw GIF dumps.

## 3. Visual packs

User can switch packs anytime. Each pack = color theme + celebration personality + optional SFX.

| Pack ID | Name | Feel | Pack celebration | Pack SFX |
|---|---|---|---|---|
| `mothership` | Mothership OS | Bioluminescent spacecraft HUD | Tractor beam lifts `TASK ✓` into saucer | Soft beam hum |
| `glitch` | Glitch Transmission | VHS / amber grit / meme stamp | Stamp overlays: CLEAR / YEETED / SHIPPED | Glitch blip |
| `soft` | Soft Abduction | Dreamcore peach / calm dopamine | Orb/cow float + chill corner toast | Warm chime |
| `root` | Root Access | Black-site terminal / hacker | ASCII saucer + `sudo celebrate` shell pop | Terminal beep |

## 4. Celebrations (C + D)

### 4.1 Display modes (hybrid)

- **Small win** → corner toast + short loop (~1.5s)
- **Big win** → full-editor overlay (~2–2.5s), then dismiss
- Respect **reduce-motion**: static smile frame + short caption only

### 4.2 Content mix

- **Pack-matched set** per active pack (bias ~60% of plays)
- **Shared smile library** of ~12–20 short loops (bias ~40%): wink alien, lift-off, signal, shipped, pwned, etc.
- Library loops are **color-tinted** to the active pack so randomness stays on-brand

### 4.3 Asset approach

Prefer lightweight **CSS / Lottie / APNG** loops over bulky GIF collections. Keep extension size small and playback snappy. Captions are short, Gen Z, smile-first (e.g. `yooo you did that`, `beamed up ✓`, `exploit deployed · tests pwned`).

### 4.4 Throttle (anti-spam)

- Max ~1 small celebration / 45 seconds
- Overlays only for classified big wins
- Intensity setting: `chill` (toast-only) · `normal` (hybrid) · `hype` (more overlays allowed)

## 5. Triggers

### 5.1 Defaults ON

- Test run passed (detected via task / test adapter / terminal heuristics where reliable)
- Build succeeded
- Git commit completed
- Debug session ended successfully

### 5.2 Defaults OFF (user-enable)

- File save
- Push / PR-related hooks when detectable
- Optional “problems cleared” style signals

### 5.3 Big vs small classification

| Big | Small |
|---|---|
| Full test suite green | Single-file / small test pass |
| Build succeed | Commit |
| — | Successful debug end |

Exact mapping is configurable; defaults as above.

## 6. Sound

- Off until user enables (or first-run opt-in prompt — implementation choice: settings default `false`)
- When on: play **active pack** short SFX on celebration
- Per-pack mute supported
- Never block UI on audio load failure

## 7. Settings & commands

**Settings (proposed keys under `orbital.*`):**

- `orbital.pack` — `mothership` \| `glitch` \| `soft` \| `root`
- `orbital.celebrations.enabled` — boolean
- `orbital.celebrations.intensity` — `chill` \| `normal` \| `hype`
- `orbital.celebrations.triggers.*` — per-trigger booleans
- `orbital.sound.enabled` — boolean
- `orbital.sound.mutedPacks` — string array
- `orbital.reduceMotion` — `auto` \| `always` \| `never` (`auto` follows OS)

**Commands:**

- `Orbital: Switch Pack`
- `Orbital: Preview Celebration`
- `Orbital: Toggle Sound`

## 8. Architecture

```
┌─────────────────────────────────────────┐
│              Orbital Extension          │
├──────────────┬──────────────────────────┤
│ Theme JSON ×4│ Celebration Engine       │
│              │  · Event bridge          │
│              │  · Throttle + classifier │
│              │  · Loop picker (C+D)     │
│              │  · Toast / overlay host  │
│              │  · Pack SFX player       │
├──────────────┴──────────────────────────┤
│ Settings · Commands · Reduce-motion     │
└─────────────────────────────────────────┘
```

- **Theme contributions** via standard VS Code theme API  
- **Celebration host** via lightweight webview or equivalent overlay surface  
- **Event bridge** wires workspace tasks, debug API, git, and best-effort test signals  
- Failures in detection degrade silently (no celebration beats a false positive spam)

## 9. Tech stack

- TypeScript
- VS Code Extension API (Cursor-compatible)
- Theme color token JSON ×4
- Webview UI for toast/overlay
- Short audio clips per pack
- Packaged as single `.vsix`

## 10. Non-goals (v1)

- Coding mini-game / refreshment arcade
- Timed coding jokes after 2 hours
- Multi-IDE ports beyond VS Code family
- Cloud sync, accounts, telemetry-heavy “engagement” backend
- Shipping large unoptimized GIF libraries

## 11. Future (post-v1, not designed here)

- Mini coding game for short breaks
- Joke drip after prolonged sessions (~2h)
- More packs / community pack format
- Finer test-framework integrations

## 12. Open implementation details (resolved at plan time)

- Exact test-pass detection strategy per common runners (Jest, Vitest, pytest, Go, etc.)
- Toast vs webview overlay implementation constraints in Cursor
- First-run onboarding: pack picker + optional sound opt-in
- Final caption copy deck and loop inventory list

These do not block the product design; they are execution choices for the implementation plan.
