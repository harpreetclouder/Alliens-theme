# ADR-006: Experience pack owns presentation, not domain outcomes

## Status

Accepted

## Context

Orbital packs began as color themes + tint/SFX. The product direction is a coherent “world,” but domain events (COMEBACK, celebration, quiet) must stay testable and pack-independent.

## Decision

- Introduce `OrbitalExperiencePack` manifests for progressive experience definition.
- Brain/domain outcomes remain pack-agnostic.
- `resolveVisualState` + `resolvePresentation` map context → VisualState + tokens/motion/labels.
- `PackDefinition` / `getPack()` remain a compatibility facade (`tint` = `tokens.accent`).
- No marketplace / no arbitrary JS from packs. Future community packs must be declarative.

## Consequences

Celebrations can keep calling `getPack()` unchanged. New UI should prefer experience manifests + presentation resolver. Ambient and dynamic theming stay future platform work behind official APIs.
