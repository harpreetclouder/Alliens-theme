import type * as vscode from 'vscode';
import { pickCaption } from '../celebrations/captions';
import { CELEBRATION_DURATION_MS } from '../celebrations/durations';
import type { CelebrationHost } from '../celebrations/host';
import { pickCelebrationVisual } from '../celebrations/visuals';
import type { OrbitalSettings } from '../config/settings';
import { getPack } from '../packs/registry';
import { MISSION_POOL } from './rules';
import type { OrbitStore } from './store';
import { localDayKey } from './winMapping';

export const CHECK_IN_DAY_KEY = 'orbital.orbit.checkInDay';

export interface DayStartContext {
  extensionUri: vscode.Uri;
  globalState: {
    get<T>(key: string): T | undefined;
    update(key: string, value: unknown): Thenable<void>;
  };
}

/**
 * Once per local calendar day: roll mission, small check-in XP (counts for streak),
 * statusbar mission-briefing whisper. Skips when orbit is disabled.
 */
export function maybeDayStart(
  context: DayStartContext,
  store: OrbitStore,
  host: CelebrationHost,
  settings: OrbitalSettings,
): void {
  void dayStartIfNeeded(context, store, host, settings);
}

/** Testable async path for day-start check-in. */
export async function dayStartIfNeeded(
  context: DayStartContext,
  store: OrbitStore,
  host: CelebrationHost,
  settings: OrbitalSettings,
  now: Date = new Date(),
): Promise<'skipped' | 'done'> {
  if (!settings.orbitEnabled) {
    return 'skipped';
  }

  const dayKey = localDayKey(now);
  const last = context.globalState.get<string>(CHECK_IN_DAY_KEY);
  if (last === dayKey) {
    return 'skipped';
  }

  await context.globalState.update(CHECK_IN_DAY_KEY, dayKey);

  const result = store.applyWin({
    dayKey,
    size: 'small',
    kind: 'checkin',
    countsForStreak: true,
  });
  await store.save(result.state);

  const missionId = result.state.mission?.id;
  const missionLabel =
    MISSION_POOL.find((m) => m.id === missionId)?.label ?? 'Daily mission';

  if (settings.celebrationsEnabled) {
    const visual = pickCelebrationVisual(settings.pack, 'toast');
    const packDef = getPack(settings.pack);
    const picked = pickCaption('checkin', settings.pack);
    const streak =
      result.state.streakDays > 1 ? result.state.streakDays : undefined;

    host.show({
      surface: 'statusbar',
      pack: settings.pack,
      mode: 'toast',
      loop: visual.loop,
      caption: picked.line,
      subline: missionLabel,
      emoji: visual.emojis.hero,
      orbitEmojis: visual.emojis.orbit,
      tint: packDef.tint,
      reduceMotion: settings.reduceMotion === 'always',
      dataReduceAuto: settings.reduceMotion === 'auto',
      durationMs: CELEBRATION_DURATION_MS.toast,
      extensionUri: context.extensionUri,
      focusSnapshot: { returnFocus: 'none' },
      streak,
    });
  }

  return 'done';
}
