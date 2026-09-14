/**
 * Local adaptive scoring stub — hard constraints always win.
 * Future: contextual bandit evaluated locally; never overrides quiet/typing/cooldown.
 */

export type AdaptiveEvent = 'opened' | 'completed' | 'dismissed' | 'immediate_dismiss';

const REWARDS: Record<AdaptiveEvent, number> = {
  opened: 1,
  completed: 2,
  dismissed: -1,
  immediate_dismiss: -2,
};

export interface AdaptiveScoreKey {
  channel: string;
  experienceKind: string;
}

export class AdaptiveExperiencePolicy {
  private scores = new Map<string, number>();

  constructor(private readonly decay = 0.98) {}

  private key(k: AdaptiveScoreKey): string {
    return `${k.channel}::${k.experienceKind}`;
  }

  observe(k: AdaptiveScoreKey, event: AdaptiveEvent): void {
    const id = this.key(k);
    const prev = this.scores.get(id) ?? 0;
    this.scores.set(id, prev * this.decay + REWARDS[event]);
  }

  score(k: AdaptiveScoreKey): number {
    return this.scores.get(this.key(k)) ?? 0;
  }

  /** Ranking hint only — caller must still apply interruption policy. */
  rank(candidates: AdaptiveScoreKey[]): AdaptiveScoreKey[] {
    return [...candidates].sort((a, b) => this.score(b) - this.score(a));
  }
}
