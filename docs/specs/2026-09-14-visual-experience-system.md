# Spec — Orbital Visual Experience System (Part 10A)

**Status:** Accepted (foundation)  
**Date:** 2026-09-14  
**Release flag:** shipped as types/resolvers/docs; ambient host & dynamic theming deferred

## Problem

Packs look like “just themes,” but Orbital aims to be a next-generation coding experience layer. Presentation sprawl (captions, scene palettes, labels) needs a coherent pack model without turning the editor into a game.

## User story

As a developer, when I pick Mothership vs Root, the **same** win (e.g. comeback) feels on-brand, while my code editor stays primary and readable.

## Non-goals (this slice)

- Marketplace / community pack loading
- Ambient WebGL host
- Dynamic `colorCustomizations` experiments
- VOID pack id
- Rewriting celebration HTML/engine

## UX

See `docs/VISUAL_SYSTEM.md` — surface hierarchy, visual states, pack personalities, forbidden patterns.

## Signals / decisions

No new signals. VisualState derives from brain outcome + typing/quiet/waiting flags.

## Privacy impact

None (local manifests only).

## Architecture

- `src/packs/experiencePacks.ts` — builtin manifests  
- `src/packs/visualState.ts` / `presentation.ts` — pure resolvers  
- `src/packs/registry.ts` — compatibility  

## Acceptance criteria

- [x] Five packs round-trip tint/themeLabel/sfx via compatibility view  
- [x] Same outcome → different `outcomeLabels` per pack  
- [x] `resolveVisualState` independent of pack id  
- [x] FOCUS/QUIET → motion off, no overlay hint  
- [x] `docs/VISUAL_SYSTEM.md` + ADR-006  
- [x] Tests + eval scenario `visual-pack-invariant`

## Evaluation scenarios

- `evals/scenarios/visual-pack-invariant.json`
- Unit: `src/__tests__/experiencePack.test.ts`
