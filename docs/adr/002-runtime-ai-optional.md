# ADR-002: Runtime AI is optional

## Status

Accepted

## Context

LLMs are useful for drafting content, not for shipping unverified knowledge into a developer’s editor.

## Decision

Default `LocalRuleBasedProvider`. Remote/BYOK/on-device providers are optional and must declare data boundaries. Core functions with zero AI API.

## Consequences

No mandatory network key for Orbital to work. Content generation stays an engineering/offline workflow.
