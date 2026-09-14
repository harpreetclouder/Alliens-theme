# ADR-001: IDE-independent Orbital Core

## Status

Accepted

## Context

Celebrations and future intermissions need deterministic tests and must not be trapped inside VS Code API types.

## Decision

Pure decision/content logic lives under `src/brain/` (and other vscode-free modules). Extension triggers/host adapt IDE events into normalized signals.

## Consequences

Evals can run in Node without Electron. Platform bugs stay isolated from policy bugs.
