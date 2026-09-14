---
name: orbital-experience
description: >-
  Create a new Orbital micro-experience safely. Use when adding games, puzzles,
  curiosity cards, transmissions, celebrations surfaces, Espresso, or intermissions.
  Requires a full experience contract and eval scenarios; never bypass interruption policy.
---

# Orbital experience

## Required specification

| Field | |
|-------|--|
| Experience ID | stable slug |
| Channel | celebration / intermission / panel / statusbar / … |
| User benefit | one sentence |
| Trigger contexts | when allowed |
| Forbidden contexts | typing, quiet, debug, … |
| Expected duration | seconds |
| Maximum duration | hard cap |
| Repeat cooldown | ms/s |
| Surface | overlay / panel / statusbar / terminal |
| Input method | none / keys / click |
| Exit behavior | auto + skip |
| Reduced-motion | static alternative |
| Offline behavior | local assets |
| Accessibility | keyboard, contrast |
| Content source | static pack / joy-brain / … |
| Telemetry/privacy | none by default |
| Test scenarios | `evals/scenarios/*.json` |

## Rules

- Register through experience/brain contracts — **never bypass** hard interruption constraints
- Finite only; immediate skip; easy return to code
- After design, implement via `orbital-feature` workflow
- Content tone: use `orbital-joy-brain` for meme/GIF locale work
