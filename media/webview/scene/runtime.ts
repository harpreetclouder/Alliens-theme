import { resolvePackPalette } from './packs';
import { sampleTimeline } from './timeline';
import { bindTypography } from './typography';
import type { SceneBootPayload } from './types';
import { createWorld } from './world';

export class SceneRuntime {
  private raf = 0;
  private start = 0;
  private disposed = false;
  private world: ReturnType<typeof createWorld> | null = null;
  private typography: ReturnType<typeof bindTypography> | null = null;
  private readonly onResize: () => void;

  constructor(
    private readonly root: HTMLElement,
    private readonly payload: SceneBootPayload,
  ) {
    this.onResize = () => this.resize();
  }

  startScene(): void {
    const prefersReduce =
      this.payload.reduceMotion ||
      (Boolean(this.payload.autoReduce) &&
        typeof matchMedia === 'function' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (prefersReduce) {
      this.startFallback();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'orbital-scene-canvas';
    canvas.className = 'scene-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    this.root.appendChild(canvas);

    const palette = resolvePackPalette(this.payload.pack, this.payload.tint);
    this.world = createWorld(canvas, palette, this.payload.surface);
    this.typography = bindTypography(
      document.getElementById('caption'),
      document.getElementById('subline'),
      document.getElementById('progressFill'),
      document.getElementById('hud'),
      this.payload.caption,
      this.payload.subline,
      false,
    );

    this.resize();
    window.addEventListener('resize', this.onResize);
    this.start = performance.now();
    this.tick(this.start);
  }

  private startFallback(): void {
    document.body.classList.add('scene-fallback');
    this.typography = bindTypography(
      document.getElementById('caption'),
      document.getElementById('subline'),
      document.getElementById('progressFill'),
      document.getElementById('hud'),
      this.payload.caption,
      this.payload.subline,
      true,
    );
    this.start = performance.now();
    const exitAt = Math.max(0, this.payload.durationMs - this.payload.exitLeadMs);
    window.setTimeout(() => document.body.classList.add('exiting'), exitAt);

    const loop = (now: number) => {
      if (this.disposed) return;
      const state = sampleTimeline(now - this.start, this.payload.durationMs, this.payload.exitLeadMs);
      this.typography?.update(state);
      if (state.progress < 1) {
        this.raf = requestAnimationFrame(loop);
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  private resize(): void {
    if (!this.world) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.world.resize(w, h, this.payload.surface);
  }

  private tick = (now: number): void => {
    if (this.disposed) return;
    const elapsed = now - this.start;
    const state = sampleTimeline(elapsed, this.payload.durationMs, this.payload.exitLeadMs);
    const palette = resolvePackPalette(this.payload.pack, this.payload.tint);
    this.world?.update(state, palette, this.payload.surface);
    this.typography?.update(state);
    if (state.progress < 1) {
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.typography?.dispose();
    this.world?.dispose();
    this.world = null;
  }
}
