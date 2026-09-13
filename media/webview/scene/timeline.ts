export type EaseFn = (t: number) => number;

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(t: number): number {
  const x = clamp01(t);
  return x * x * x;
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface TimelineState {
  /** 0..1 overall progress */
  progress: number;
  /** enter 0..1 */
  enter: number;
  /** hold intensity 0..1 */
  hold: number;
  /** exit 0..1 */
  exit: number;
  /** elapsed ms */
  elapsed: number;
  /** camera dolly 0..1 */
  dolly: number;
  /** caption reveal 0..1 */
  caption: number;
  /** fog density scale */
  fogScale: number;
  /** particle swirl */
  swirl: number;
  /** exit active */
  exiting: boolean;
}

/**
 * Enter → hold → exit choreography mapped to durationMs / exitLeadMs.
 */
export function sampleTimeline(
  elapsedMs: number,
  durationMs: number,
  exitLeadMs: number,
): TimelineState {
  const progress = clamp01(elapsedMs / Math.max(1, durationMs));
  const exitStart = Math.max(0, durationMs - exitLeadMs);
  const enter = easeOutCubic(elapsedMs / 1100);
  const caption = easeOutCubic((elapsedMs - 180) / 1400);
  const exit = elapsedMs >= exitStart ? easeInCubic((elapsedMs - exitStart) / Math.max(1, exitLeadMs)) : 0;
  const holdWindow = Math.max(1, exitStart - 1100);
  const holdRaw = clamp01((elapsedMs - 900) / holdWindow);
  const hold = easeInOutCubic(holdRaw) * (1 - exit);
  const dolly = easeInOutCubic(clamp01(elapsedMs / (durationMs * 0.85)));
  const fogScale = lerp(1.35, 0.85, enter) * lerp(1, 1.6, exit);
  const swirl = hold * (0.55 + 0.45 * Math.sin(elapsedMs / 900));
  return {
    progress,
    enter,
    hold,
    exit,
    elapsed: elapsedMs,
    dolly,
    caption: clamp01(caption),
    fogScale,
    swirl,
    exiting: exit > 0.02,
  };
}
