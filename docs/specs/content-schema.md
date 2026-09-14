# Content schema (offline generation)

AI tools may **draft** content; humans approve; Orbital ships **static** versioned files. Do not present runtime LLM hallucinations as facts.

```json
{
  "id": "string",
  "type": "curiosity|trivia|joke|puzzle|micro_learning",
  "channel": "intermission|celebration|panel",
  "title": "string",
  "body": "string",
  "estimatedSeconds": 30,
  "difficulty": "easy|medium|hard",
  "tags": ["string"],
  "sources": ["url or citation"],
  "reviewed": false,
  "version": 1
}
```

Pipeline: schema validate → fact check (if factual) → duplicate detect → tone/safety → duration score → human `reviewed: true` → commit under `media/content/`.
