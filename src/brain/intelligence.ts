/**
 * Optional intelligence provider — Core works without any AI API.
 * Runtime must not depend on remote LLMs. Content generation is offline/tooling.
 */

export interface ExperienceCandidate {
  id: string;
  channel: string;
  estimatedSeconds: number;
  tags: string[];
}

export interface RankContext {
  signalKind?: string;
  quietMode: boolean;
  typing: boolean;
}

export interface OrbitalIntelligenceProvider {
  rankExperiences(
    candidates: ExperienceCandidate[],
    ctx: RankContext,
  ): ExperienceCandidate[];
}

/** Default: stable local ordering; no network. */
export class LocalRuleBasedProvider implements OrbitalIntelligenceProvider {
  rankExperiences(
    candidates: ExperienceCandidate[],
    ctx: RankContext,
  ): ExperienceCandidate[] {
    if (ctx.typing || ctx.quietMode) {
      return [];
    }
    return [...candidates].sort((a, b) => a.estimatedSeconds - b.estimatedSeconds);
  }
}

/** Future optional — never send source code by default. */
export interface RemoteAIProviderOptions {
  apiKey: string;
  /** Explicit allowlist of fields permitted to leave device */
  allowedFields: string[];
}
