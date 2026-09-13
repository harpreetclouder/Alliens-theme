import { MISSION_POOL, levelFromXp, xpToNextLevel } from '../orbit/rules';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CelebrationHtmlOpts {
  cssUri: string;
  mode: 'toast' | 'overlay' | 'panel';
  loopClass: string;
  gifUri?: string;
  caption: string;
  subline?: string;
  emoji: string;
  orbitEmojis?: [string, string, string];
  tint: string;
  reduceMotion: boolean;
  dataReduceAuto?: boolean;
  durationMs: number;
  exitLeadMs: number;
  cspSource: string;
  sfxUri?: string;
}

export function buildCelebrationHtml(opts: CelebrationHtmlOpts): string {
  const modeClass =
    opts.mode === 'toast' ? 'mode-toast' : opts.mode === 'panel' ? 'mode-panel' : 'mode-overlay';
  const motionClass = opts.reduceMotion ? 'reduce-motion' : '';
  const bodyClasses = [modeClass, motionClass].filter(Boolean).join(' ');
  const bodyAttrs = opts.dataReduceAuto ? ' data-reduce="auto"' : '';
  const audioTag = opts.sfxUri
    ? `<audio autoplay src="${opts.sfxUri}" aria-hidden="true"></audio>`
    : '';
  const sublineHtml = opts.subline
    ? `<p class="subline">${escapeHtml(opts.subline)}</p>`
    : '';
  const orbitHtml =
    opts.orbitEmojis && opts.orbitEmojis.length > 0
      ? `<div class="emoji-orbit" aria-hidden="true">${opts.orbitEmojis
          .map((e, i) => `<span class="orbit-item orbit-${i + 1}">${e}</span>`)
          .join('')}</div>`
      : '';
  const gifHtml = opts.gifUri
    ? `<img class="hero-gif" src="${opts.gifUri}" alt="" aria-hidden="true" />`
    : '';
  const loopHtml = opts.gifUri
    ? ''
    : `<div class="loop ${opts.loopClass}" aria-hidden="true"></div>`;
  const visualClass = opts.gifUri ? 'has-gif' : 'has-loop';
  const exitAt = Math.max(0, opts.durationMs - opts.exitLeadMs);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; media-src ${opts.cspSource}; img-src ${opts.cspSource}; script-src 'unsafe-inline';">
  <link rel="stylesheet" href="${opts.cssUri}">
  <style>body { --tint: ${opts.tint}; --duration: ${opts.durationMs}ms; }</style>
</head>
<body class="${bodyClasses} ${visualClass}"${bodyAttrs}>
  ${audioTag}
  <div class="celebration">
    <div class="visual-col">
      ${orbitHtml}
      <div class="hero-emoji" aria-hidden="true">${opts.emoji}</div>
      ${gifHtml}
      ${loopHtml}
    </div>
    <div class="text-col">
      <p class="caption">${escapeHtml(opts.caption)}</p>
      ${sublineHtml}
    </div>
  </div>
  <script>
    window.setTimeout(function () {
      document.body.classList.add('exiting');
    }, ${exitAt});
  </script>
</body>
</html>`;
}

export interface IdleOrbitView {
  level: number;
  xp: number;
  xpToNext: number;
  streakDays: number;
  missionLabel: string;
  missionProgress: number;
  missionTarget: number;
}

/** Snapshot OrbitState for the panel idle HUD (xpToNext from level curve). */
export function idleOrbitViewFromState(state: {
  xp: number;
  level: number;
  streakDays: number;
  mission: { id: string; progress: number; target: number } | null;
}): IdleOrbitView {
  const level = levelFromXp(state.xp);
  const missionDef = state.mission
    ? MISSION_POOL.find((m) => m.id === state.mission!.id)
    : undefined;
  return {
    level,
    xp: state.xp,
    xpToNext: xpToNextLevel(state.xp),
    streakDays: state.streakDays,
    missionLabel: missionDef?.label ?? (state.mission ? state.mission.id : 'No mission yet'),
    missionProgress: state.mission?.progress ?? 0,
    missionTarget: state.mission?.target ?? 0,
  };
}

function idleOrbitProgressPct(orbit: IdleOrbitView): number {
  const level = orbit.level;
  const bandStart = (level - 1) * (level - 1) * 50;
  const bandEnd = level * level * 50;
  const span = Math.max(1, bandEnd - bandStart);
  const into = Math.max(0, Math.min(span, orbit.xp - bandStart));
  return Math.round((into / span) * 100);
}

function renderIdleOrbitCard(orbit: IdleOrbitView): string {
  const pct = idleOrbitProgressPct(orbit);
  const mission =
    orbit.missionTarget > 0
      ? `${escapeHtml(orbit.missionLabel)} · ${orbit.missionProgress}/${orbit.missionTarget}`
      : escapeHtml(orbit.missionLabel);
  return `<div class="idle-orbit-card">
      <div class="idle-orbit-row">
        <span class="idle-orbit-level">L${orbit.level}</span>
        <span class="idle-orbit-xp">${orbit.xp} XP · ${orbit.xpToNext} to next</span>
        <span class="idle-orbit-streak">${orbit.streakDays > 0 ? `🔥 ${orbit.streakDays}` : '🔥 —'}</span>
      </div>
      <div class="idle-orbit-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="idle-orbit-fill" style="width:${pct}%"></div>
      </div>
      <div class="idle-orbit-mission">${mission}</div>
    </div>`;
}

export function buildIdlePanelHtml(
  cspSource: string,
  cssUri: string,
  orbit?: IdleOrbitView,
): string {
  const orbitBlock = orbit ? renderIdleOrbitCard(orbit) : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline';">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body class="mode-panel mode-idle">
  <div class="celebration idle">
    <span class="idle-icon">🛸</span>
    <span class="idle-text">Orbital standing by — run tests or Preview Celebration</span>
    ${orbitBlock}
  </div>
</body>
</html>`;
}
