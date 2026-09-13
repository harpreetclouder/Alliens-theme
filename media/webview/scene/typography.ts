import type { TimelineState } from './timeline';

export interface TypographyHud {
  update: (state: TimelineState) => void;
  dispose: () => void;
}

/**
 * Kinetic caption on DOM overlay — crisp text synced to timeline.
 */
export function bindTypography(
  captionEl: HTMLElement | null,
  sublineEl: HTMLElement | null,
  progressEl: HTMLElement | null,
  hudEl: HTMLElement | null,
  caption: string,
  subline: string | undefined,
  reduceMotion: boolean,
): TypographyHud {
  if (captionEl) {
    captionEl.setAttribute('data-text', caption);
    if (reduceMotion) {
      captionEl.textContent = caption;
    } else {
      captionEl.textContent = '';
      const chars = Array.from(caption);
      chars.forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        span.style.setProperty('--d', `${i * 22}ms`);
        captionEl.appendChild(span);
      });
    }
  }

  if (sublineEl) {
    if (subline) {
      sublineEl.hidden = false;
      sublineEl.textContent = subline;
      if (!reduceMotion) {
        sublineEl.style.opacity = '0';
        sublineEl.style.transform = 'translateY(18px)';
      }
    } else {
      sublineEl.hidden = true;
    }
  }

  let subRevealed = reduceMotion || !subline;

  const update = (state: TimelineState) => {
    if (progressEl) {
      progressEl.style.width = `${state.progress * 100}%`;
    }

    if (captionEl && !reduceMotion) {
      const children = captionEl.children;
      const n = children.length || 1;
      for (let i = 0; i < children.length; i++) {
        const el = children[i] as HTMLElement;
        const local = Math.min(1, Math.max(0, (state.caption * n - i) / 1.2));
        el.style.opacity = String(local);
        el.style.transform = `translateY(${(1 - local) * 14}px)`;
      }
    }

    if (sublineEl && !subRevealed && state.caption > 0.55) {
      subRevealed = true;
      sublineEl.style.transition = 'opacity 0.7s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1)';
      sublineEl.style.opacity = '1';
      sublineEl.style.transform = 'translateY(0)';
    }

    if (hudEl && !reduceMotion) {
      const bob = Math.sin(state.elapsed / 700) * 5 * (1 - state.exit);
      const scale = 0.96 + state.enter * 0.04;
      const fade = 1 - state.exit * 0.9;
      hudEl.style.opacity = String(fade);
      hudEl.style.transform = `translate3d(0, ${bob}px, 0) scale(${scale})`;
    }

    if (state.exiting) {
      document.body.classList.add('exiting');
    }
  };

  return {
    update,
    dispose: () => {
      /* no-op */
    },
  };
}
