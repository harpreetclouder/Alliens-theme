---
name: orbital-signal
description: >-
  Add a workflow signal to Orbital (tests pass, commit, build, idle, typing, …).
  Use before wiring new IDE event listeners. Emphasize minimum data and pure normalization.
---

# Orbital signal

## Required analysis

1. What user/workflow event does it represent?
2. Which official IDE API provides it?
3. What **minimum** data is required? (avoid raw payloads)
4. Is raw source/terminal data avoidable?
5. How is it normalized into a typed signal?
6. Confidence / false-positive handling?
7. Which outcomes may consume it?
8. How do we test it (unit + eval scenario)?
9. What if the API is unavailable? (fallback / no-op)

## Implementation notes

- Adapter in `src/triggers/` (or equivalent) → emit normalized signal
- Decision/policy stays in `src/brain/` (pure)
- Guard proposed APIs so activation cannot crash
- Privacy review if terminal/editor/network involved
