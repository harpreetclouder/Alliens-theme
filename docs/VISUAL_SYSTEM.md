# Orbital Visual System

**Principle:** The IDE should feel like a coherent world. **Code remains the hero.** Orbital enhances the environment around the work — never a video-game UI covering the editor.

## Design principles

1. **Editor primary** — readability and caret focus beat world-building.
2. **Coherent pack world** — palette, motion, sound, and copy share one personality.
3. **Same outcome, different skin** — brain/domain events (COMEBACK, CELEBRATION) stay pack-independent; packs only present them.
4. **Alive, not noisy** — ambient is optional, pause-when-hidden, reduced-motion safe, negligible cost.
5. **Finite beats** — celebrations/transmissions have duration + skip; no feeds or engagement loops.
6. **Official APIs only** — no IDE internal hacks for dynamic chrome.

## Pack architecture

Packs are progressive **`OrbitalExperiencePack`** manifests (`src/packs/experiencePacks.ts`).

| Layer | Role |
|-------|------|
| `visualTheme` | Color theme contribution + design tokens + accentMode |
| `motion` | Intensity + celebration/transition style ids |
| `sound` | Optional profile + sfx file |
| `personality` | Tone, vocabulary, **outcomeLabels** (COMEBACK copy per pack) |
| `ambient` | Declarative eligibility (default off in v1) |
| `experienceOverrides` | Renderer ids for future games/puzzles (declarative) |

Compatibility: `getPack()` still returns `{ id, label, themePath, sfxFile, tint }` for existing celebrations.

### Builtin personalities

| Pack | Feel |
|------|------|
| Mothership | Mission control / deep-space HUD |
| Glitch | Controlled digital corruption |
| Soft | Calm futuristic, low stimulation |
| Root | Terminal/systems, minimal motion |
| Acid | Expressive collage (optional high energy) |
| **VOID** (future) | Ultra-minimal — intelligence without gamification chrome |

Do not add packs for quantity. Each must be a distinct experience personality.

### Outcome presentation example

| Outcome | Mothership | Glitch | Root | Soft |
|---------|------------|--------|------|------|
| COMEBACK | MISSION RECOVERED | SYSTEM RESTORED | process recovered successfully | You're back on track. |

## Visual states

`NORMAL | FOCUS | WAITING | CELEBRATION | COMEBACK | TRANSMISSION | QUIET`

Resolved by `resolveVisualState` (pure). Pack id must not change the state.

| State | Overlay | Ambient | Notes |
|-------|---------|---------|-------|
| FOCUS / QUIET | Blocked | 0 | Hard veto |
| WAITING | Blocked | ≤1 if enabled | Peripheral only |
| CELEBRATION / COMEBACK / TRANSMISSION | Allowed if prefs allow | 0 | Finite + skip |
| NORMAL | No | Optional low | Idle world |

## Surface hierarchy

0. Editor (never opaque game cover)  
1. Status bar  
2. Terminal (native wins)  
3. Orbital panel (if user opened / opted)  
4. Overlay webview (`preserveFocus`, auto-dispose)

## Motion system

- Budgets: `off | minimal | normal | expressive`
- Reduced motion → `off` ambient + motion
- Prefer composition, micro-interaction, and information design over blanket neon glow

## Design tokens

Per pack: `accent`, `accentSoft`, `surface`, `success`, `warning`, `signal`.  
Spacing/radius/glow scales are documented for webviews; inject as CSS variables when rendering Orbital-owned surfaces.

## Dynamic theming

`resolveThemeFrame` keeps the pack's official `workbench.colorTheme` locked. A shown win may set `statusBar.background` / `statusBar.foreground` from the pack accent, then `ThemeHost` restores the previous values. Typing, quiet mode, and a skipped moment clear that tint. Editor and syntax token colors are never written.

## Ambient (future host)

Rules: negligible cost, pause when not visible, respect reduced motion, optional, never near active code glyphs. Target: *Alive, not noisy.*

## Accessibility

- `orbital.reduceMotion` / OS preference  
- Contrast for captions on washes  
- Immediate skip for overlays (when wired)  
- Quiet mode absolute veto

## Performance

- Event-driven; dispose timers  
- No continuous GPU for hidden panels  
- Lazy experience assets  
- Giphy/network time-budgeted

## Assets

- Themes: `themes/*-color-theme.json` via `contributes.themes`  
- SFX: `media/sfx/`  
- GIFs/loops: pack folders + shared library  
- Manifests: TypeScript registry today; future community packs = **declarative JSON only** (no arbitrary JS)

## Community packs (design only — do not ship marketplace)

Declarative/static manifests + schema validation. Security first. No executable pack code.

## Related

- Types: `src/packs/types.ts`
- Resolver: `src/packs/visualState.ts`, `src/packs/presentation.ts`
- ADR-006: experience pack presentation separation
- Spec: `docs/specs/2026-09-14-visual-experience-system.md`
