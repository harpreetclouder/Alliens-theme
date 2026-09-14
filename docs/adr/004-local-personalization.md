# ADR-004: Local personalization preferred

## Status

Accepted

## Context

Personalization can improve timing without exporting private work.

## Decision

Adaptive scores stay on-device (`AdaptiveExperiencePolicy`). Hard interruption constraints always win over scores.

## Consequences

No learning of preferences via remote LLM by default.
