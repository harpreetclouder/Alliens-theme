# ADR-005: No raw terminal or source persistence

## Status

Accepted

## Context

Terminal buffers and source code are highly sensitive.

## Decision

Do not collect or persist raw terminal history or raw source. Signals must be normalized minimum events. Remote export of command text/source is a Critical privacy reject.

## Consequences

Triggers may observe events transiently; storage is aggregates/flags only.
