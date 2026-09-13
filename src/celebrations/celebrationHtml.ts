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
  animFlavor?: string;
  tone?: string;
  /** Joy collage for overlay + panel (meme board). */
  collage?: boolean;
  pack?: string;
  surface?: 'overlay' | 'panel';
  regionId?: string;
  regionLabel?: string;
  /** Required by Giphy ToS when showing their content */
  giphyAttribution?: boolean;
}

function particleSpans(count: number): string {
  return Array.from({ length: count }, (_, i) => `<i class="p" style="--i:${i}"></i>`).join('');
}

export function buildCelebrationHtml(opts: CelebrationHtmlOpts): string {
  const useCollage =
    Boolean(opts.collage) && (opts.mode === 'overlay' || opts.mode === 'panel');
  const modeClass =
    opts.mode === 'toast' ? 'mode-toast' : opts.mode === 'panel' ? 'mode-panel' : 'mode-overlay';
  const motionClass = opts.reduceMotion ? 'reduce-motion' : '';
  const collageClass = useCollage ? 'joy-collage' : 'motion-engine';
  const bodyClasses = [modeClass, motionClass, 'era-joy', collageClass].filter(Boolean).join(' ');
  const bodyAttrs = opts.dataReduceAuto ? ' data-reduce="auto"' : '';
  const audioTag = opts.sfxUri
    ? `<audio autoplay src="${opts.sfxUri}" aria-hidden="true"></audio>`
    : '';
  const sublineHtml = opts.subline
    ? `<p class="subline" id="subline">${escapeHtml(opts.subline)}</p>`
    : '<p class="subline" id="subline" hidden></p>';
  const stickers = [
    opts.emoji,
    ...(opts.orbitEmojis ?? []),
  ].filter(Boolean);
  while (stickers.length < 5) {
    stickers.push(opts.emoji || '✨');
  }
  const stickerHtml = stickers
    .slice(0, 5)
    .map((s, i) => `<span class="sticker s${i + 1}" style="--i:${i}">${s}</span>`)
    .join('');
  const gifHtml = opts.gifUri
    ? `<img class="collage-gif" id="heroGif" src="${opts.gifUri}" alt="" />`
    : `<div class="collage-gif placeholder loop ${opts.loopClass}" aria-hidden="true"></div>`;
  const visualClass = opts.gifUri ? 'has-gif' : 'has-loop';
  const animClass = opts.animFlavor ? `anim-${opts.animFlavor}` : 'anim-pulse-zoom';
  const toneClass = opts.tone ? `tone-${opts.tone}` : '';
  const exitAt = Math.max(0, opts.durationMs - opts.exitLeadMs);
  const captionJson = JSON.stringify(opts.caption);
  const flavorJson = JSON.stringify(opts.animFlavor ?? 'pulse-zoom');
  const reduce = opts.reduceMotion ? 'true' : 'false';
  const regionBit = opts.regionLabel
    ? ` · ${escapeHtml(opts.regionLabel)}`
    : opts.regionId
      ? ` · ${escapeHtml(opts.regionId.toUpperCase())}`
      : '';

  const imgSrc = opts.gifUri?.startsWith('http')
    ? `${opts.cspSource} https:`
    : opts.cspSource;

  if (useCollage) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; media-src ${opts.cspSource}; img-src ${imgSrc}; script-src 'unsafe-inline';">
  <link rel="stylesheet" href="${opts.cssUri}">
  <style>
    body {
      --tint: ${opts.tint};
      --duration: ${opts.durationMs}ms;
      --tint-soft: color-mix(in srgb, ${opts.tint} 28%, transparent);
      --paper: #fff6e8;
      --ink: #1a1420;
    }
  </style>
</head>
<body class="${bodyClasses} ${visualClass} ${animClass} ${toneClass}"${bodyAttrs}>
  ${audioTag}
  <div class="collage-wash" aria-hidden="true"></div>
  <div class="collage-board" id="board">
    <div class="gif-stage">
      ${gifHtml}
      <div class="sticker-layer" aria-hidden="true">${stickerHtml}</div>
    </div>
    <div class="joke-card" id="hud">
      <p class="hud-label" id="hudLabel">JOY${regionBit}</p>
      <p class="caption" id="caption"></p>
      ${sublineHtml}
      <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progressFill"></div></div>
      ${
        opts.giphyAttribution
          ? '<p class="giphy-attr" aria-hidden="true">Powered by GIPHY</p>'
          : ''
      }
    </div>
  </div>
  <script>
(function () {
  var CAPTION = ${captionJson};
  var REDUCE = ${reduce};
  var EXIT_AT = ${exitAt};
  var DURATION = ${opts.durationMs};
  var captionEl = document.getElementById('caption');
  var board = document.getElementById('board');
  var progress = document.getElementById('progressFill');
  var subEl = document.getElementById('subline');
  var start = performance.now();
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
  if (captionEl) {
    if (REDUCE) { captionEl.textContent = CAPTION; }
    else {
      captionEl.textContent = '';
      Array.from(CAPTION).forEach(function (ch, i) {
        var span = document.createElement('span');
        span.className = 'ch';
        span.textContent = ch === ' ' ? '\\u00A0' : ch;
        span.style.setProperty('--d', (i * 20) + 'ms');
        captionEl.appendChild(span);
      });
    }
  }
  if (subEl && !subEl.hidden && !REDUCE) {
    subEl.style.opacity = '0';
    subEl.style.transform = 'translateY(12px)';
    setTimeout(function () {
      subEl.style.transition = 'opacity .55s ease, transform .6s cubic-bezier(.16,1,.3,1)';
      subEl.style.opacity = '1';
      subEl.style.transform = 'translateY(0)';
    }, 500);
  }
  function frame(now) {
    var t = Math.min(1, (now - start) / DURATION);
    if (progress) progress.style.width = (easeInOut(t) * 100) + '%';
    if (board && !REDUCE) {
      var bob = Math.sin(now / 900) * 4;
      board.style.transform = 'translate3d(0,' + bob + 'px,0)';
    }
    if (t < 1 && !document.body.classList.contains('exiting')) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.setTimeout(function () { document.body.classList.add('exiting'); }, EXIT_AT);
})();
  </script>
</body>
</html>`;
  }

  const orbitHtml =
    opts.orbitEmojis && opts.orbitEmojis.length > 0
      ? `<div class="emoji-orbit" aria-hidden="true">${opts.orbitEmojis
          .map((e, i) => `<span class="orbit-item orbit-${i + 1}">${e}</span>`)
          .join('')}</div>`
      : '';
  const legacyGifHtml = opts.gifUri
    ? `<img class="hero-gif" id="heroGif" src="${opts.gifUri}" alt="" aria-hidden="true" />`
    : '';
  const loopHtml = opts.gifUri
    ? ''
    : `<div class="loop ${opts.loopClass}" aria-hidden="true"></div>`;
  const scriptSrc = `script-src 'unsafe-inline'`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; media-src ${opts.cspSource}; img-src ${opts.cspSource}; ${scriptSrc};">
  <link rel="stylesheet" href="${opts.cssUri}">
  <style>
    body {
      --tint: ${opts.tint};
      --duration: ${opts.durationMs}ms;
      --tint-soft: color-mix(in srgb, ${opts.tint} 35%, transparent);
      --magenta: #ff2d95;
      --cyan: #5ef2ff;
    }
  </style>
</head>
<body class="${bodyClasses} ${visualClass} ${animClass} ${toneClass}"${bodyAttrs}>
  ${audioTag}
  <canvas id="fxCanvas" class="fx-canvas" aria-hidden="true"></canvas>
  <div class="fx-layer" aria-hidden="true">
    <div class="aurora a1"></div>
    <div class="aurora a2"></div>
    <div class="aurora a3"></div>
    <div class="shockwave s1"></div>
    <div class="shockwave s2"></div>
    <div class="shockwave s3"></div>
    <div class="beam-sweep"></div>
    <div class="grid-floor"></div>
    <div class="spark-field">${particleSpans(24)}</div>
    <div class="confetti-field">${particleSpans(18)}</div>
    <div class="scanlines"></div>
    <div class="vignette"></div>
  </div>
  <div class="celebration glass-hud" id="hud">
    <svg class="hud-svg" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="ring r-a" cx="100" cy="100" r="88" />
      <circle class="ring r-b" cx="100" cy="100" r="72" />
      <circle class="ring r-c" cx="100" cy="100" r="56" />
      <path class="arc" d="M30,100 A70,70 0 0 1 170,100" />
    </svg>
    <div class="visual-col">
      ${orbitHtml}
      <div class="hero-stage" id="heroStage">
        <div class="hero-glow"></div>
        <div class="hero-emoji" id="heroEmoji" aria-hidden="true">${opts.emoji}</div>
        ${legacyGifHtml}
        ${loopHtml}
      </div>
    </div>
    <div class="text-col">
      <p class="hud-label" id="hudLabel">ORBITAL · ${opts.tone ? escapeHtml(opts.tone.toUpperCase()) : 'LIVE'}</p>
      <p class="caption" id="caption" data-text=""></p>
      ${sublineHtml}
      <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progressFill"></div></div>
    </div>
  </div>
  <script>
(function () {
  var CAPTION = ${captionJson};
  var FLAVOR = ${flavorJson};
  var REDUCE = ${reduce};
  var EXIT_AT = ${exitAt};
  var DURATION = ${opts.durationMs};
  var captionEl = document.getElementById('caption');
  var subEl = document.getElementById('subline');
  var hud = document.getElementById('hud');
  var canvas = document.getElementById('fxCanvas');
  var progress = document.getElementById('progressFill');
  var hero = document.getElementById('heroStage');
  var start = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function revealCaption() {
    if (!captionEl) return;
    captionEl.setAttribute('data-text', CAPTION);
    if (REDUCE) {
      captionEl.textContent = CAPTION;
      return;
    }
    captionEl.textContent = '';
    var chars = Array.from(CAPTION);
    chars.forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch === ' ' ? '\\u00A0' : ch;
      span.style.setProperty('--d', (i * 28) + 'ms');
      captionEl.appendChild(span);
    });
    if (FLAVOR === 'glitch-text') {
      captionEl.classList.add('live-glitch');
    }
    if (FLAVOR === 'typewriter') {
      captionEl.classList.add('live-type');
      chars.forEach(function (_, i) {
        var el = captionEl.children[i];
        if (el) el.style.animationDelay = (80 + i * 32) + 'ms';
      });
    }
  }

  function setupCanvas() {
    if (!canvas || REDUCE) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return ctx;
  }

  var ctx = setupCanvas();
  var particles = [];
  var W = window.innerWidth;
  var H = window.innerHeight;
  var cx = W / 2;

  function spawnBurst(n, power) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = (0.6 + Math.random() * 2.4) * power;
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: H * 0.42 + (Math.random() - 0.5) * 40,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        r: 1.5 + Math.random() * 3.5,
        hue: Math.random() < 0.45 ? 0 : Math.random() < 0.5 ? 1 : 2
      });
    }
  }

  if (!REDUCE) {
    spawnBurst(FLAVOR === 'confetti' ? 90 : 55, FLAVOR === 'confetti' ? 3.2 : 2.2);
    setTimeout(function () { spawnBurst(40, 1.6); }, 900);
    setTimeout(function () { spawnBurst(30, 1.2); }, 2200);
  }

  var tint = getComputedStyle(document.body).getPropertyValue('--tint').trim() || '#1cff9a';
  var colors = [tint, '#ff2d95', '#5ef2ff'];

  function frame(now) {
    var t = Math.min(1, (now - start) / DURATION);
    var enter = easeOutCubic(Math.min(1, (now - start) / 900));

    if (progress) {
      progress.style.width = (easeInOut(t) * 100) + '%';
    }

    if (hud && !REDUCE) {
      var bob = Math.sin(now / 700) * 6;
      var scale = 0.94 + enter * 0.06 + Math.sin(now / 1100) * 0.008;
      var shake = (FLAVOR === 'glitch-text' && t < 0.35)
        ? (Math.random() - 0.5) * 4 * (1 - t / 0.35)
        : 0;
      hud.style.transform = 'translate3d(' + shake + 'px,' + bob + 'px,0) scale(' + scale + ')';
    }

    if (hero && !REDUCE) {
      var hs = 0.85 + easeOutBack(Math.min(1, (now - start) / 800)) * 0.15;
      var hy = Math.sin(now / 650) * 10;
      hero.style.transform = 'translate3d(0,' + hy + 'px,0) scale(' + hs + ')';
    }

    if (ctx && !REDUCE) {
      W = window.innerWidth;
      H = window.innerHeight;
      cx = W / 2;
      ctx.clearRect(0, 0, W, H);

      for (var r = 0; r < 3; r++) {
        var rt = (t * 1.4 + r * 0.22) % 1;
        var radius = 40 + rt * Math.max(W, H) * 0.55;
        ctx.beginPath();
        ctx.arc(cx, H * 0.42, radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors[r % 3];
        ctx.globalAlpha = (1 - rt) * 0.35;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = colors[p.hue];
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowBlur = 12;
        ctx.shadowColor = colors[p.hue];
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      var sy = (H * 0.15) + ((now / 18) % (H * 0.7));
      var grad = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, tint);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(0, sy - 20, W, 40);
      ctx.globalAlpha = 1;
    }

    if (t < 1 && !document.body.classList.contains('exiting')) {
      requestAnimationFrame(frame);
    }
  }

  revealCaption();
  if (subEl && !subEl.hidden && !REDUCE) {
    subEl.style.opacity = '0';
    setTimeout(function () {
      subEl.style.transition = 'opacity 0.6s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      subEl.style.opacity = '1';
      subEl.style.transform = 'translateY(0)';
    }, 700);
    subEl.style.transform = 'translateY(16px)';
  }

  requestAnimationFrame(frame);
  window.setTimeout(function () {
    document.body.classList.add('exiting');
  }, EXIT_AT);
})();
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
