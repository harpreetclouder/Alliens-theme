import { ACHIEVEMENTS } from './rules';

export function levelUpCaption(level: number): { caption: string; subline: string } {
  return {
    caption: `Level ${level} unlocked`,
    subline: 'Orbit climbing — keep shipping.',
  };
}

export function milestoneCaption(days: number): { caption: string; subline: string } {
  return {
    caption: `${days}-day streak`,
    subline: 'Calendar orbit holding steady.',
  };
}

export function missionCompleteCaption(): { caption: string; subline: string } {
  return {
    caption: 'Mission clear',
    subline: 'Daily objective complete — bonus XP locked in.',
  };
}

export function achievementsCaption(ids: string[]): { caption: string; subline: string } {
  const labels = ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id);
  if (labels.length === 1) {
    return {
      caption: labels[0],
      subline: 'Achievement unlocked.',
    };
  }
  return {
    caption: `${labels.length} achievements unlocked`,
    subline: labels.join(' · '),
  };
}

export function mediumFollowUpCopy(input: {
  leveledUp: boolean;
  level: number;
  unlocked: string[];
}): { caption: string; subline: string } | undefined {
  const parts: { caption: string; subline: string }[] = [];
  if (input.leveledUp) {
    parts.push(levelUpCaption(input.level));
  }
  if (input.unlocked.length > 0) {
    parts.push(achievementsCaption(input.unlocked));
  }
  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return {
    caption: parts.map((p) => p.caption).join(' · '),
    subline: parts.map((p) => p.subline).join(' '),
  };
}

export function bigFollowUpCopy(input: {
  milestone?: number;
  missionCompleted: boolean;
}): { caption: string; subline: string } | undefined {
  if (input.milestone && input.missionCompleted) {
    const m = milestoneCaption(input.milestone);
    return {
      caption: m.caption,
      subline: `${m.subline} Mission clear too.`,
    };
  }
  if (input.milestone) {
    return milestoneCaption(input.milestone);
  }
  if (input.missionCompleted) {
    return missionCompleteCaption();
  }
  return undefined;
}
