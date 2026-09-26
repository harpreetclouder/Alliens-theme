#!/usr/bin/env node
/**
 * Visual GIF harness. Opens the real celebration HTML in Chromium and fails
 * when the hero image stays blank.
 *
 *   npm run verify:gif
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const htmlPath = path.join(root, 'out', 'celebrations', 'celebrationHtml.js');
const gifFile = path.join(root, 'media', 'gifs', 'mothership', 'ufo-beam.gif');
const cssFile = path.join(root, 'media', 'webview', 'celebration.css');
const shotDir = path.join(root, '.tmp-gif-verify');

if (!fs.existsSync(htmlPath)) {
  console.error('✗ Missing out/celebrations/celebrationHtml.js — run npm run compile');
  process.exit(1);
}
if (!fs.existsSync(gifFile)) {
  console.error('✗ Missing local GIF', gifFile);
  process.exit(1);
}
const UNAVAILABLE_GIF_SHA = '0d9a460488cfb8a755fad15414a7e743437267bbdfb3283b0be5c2155cfe5ca2';
const gifHash = crypto.createHash('sha256').update(fs.readFileSync(gifFile)).digest('hex');
if (gifHash === UNAVAILABLE_GIF_SHA) {
  console.error('✗ Pack GIF is the "content not available" placeholder');
  process.exit(1);
}

const { buildCelebrationHtml } = require(htmlPath);

function pageHtml(origin, gifUri) {
  return buildCelebrationHtml({
    cssUri: `${origin}/celebration.css`,
    mode: 'overlay',
    collage: true,
    loopClass: 'loop-orbit',
    gifUri,
    caption: 'GIF check',
    emoji: '🛸',
    orbitEmojis: ['✨', '🎉', '🙌'],
    tint: '#1cff9a',
    reduceMotion: true,
    durationMs: 9000,
    exitLeadMs: 1000,
    cspSource: origin,
    pack: 'mothership',
    surface: 'overlay',
  });
}

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

const { server, port } = await listen((req, res) => {
  const origin = `http://127.0.0.1:${port}`;
  if (req.url === '/celebration.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(fs.readFileSync(cssFile));
    return;
  }
  if (req.url === '/ufo.gif') {
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(fs.readFileSync(gifFile));
    return;
  }
  if (req.url === '/ok') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(pageHtml(origin, `${origin}/ufo.gif`));
    return;
  }
  if (req.url === '/bad') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(pageHtml(origin, `${origin}/missing.gif`));
    return;
  }
  res.writeHead(404);
  res.end();
});

const origin = `http://127.0.0.1:${port}`;
let failed = 0;

try {
  const { chromium } = require('playwright');
  fs.mkdirSync(shotDir, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });

  await page.goto(`${origin}/ok`, { waitUntil: 'networkidle' });
  const painted = await page.waitForFunction(() => {
    const img = document.getElementById('heroGif');
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 10;
  }, null, { timeout: 5000 }).then(() =>
    page.evaluate(() => {
      const img = document.getElementById('heroGif');
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 48, 48);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 16) {
        colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      }
      return { width: img.naturalWidth, height: img.naturalHeight, colors: colors.size };
    }),
  );

  const shot = path.join(shotDir, 'gif-ok.png');
  await page.screenshot({ path: shot });
  console.log(`  painted ${painted.width}x${painted.height} colors=${painted.colors}`);
  console.log(`  screenshot ${shot}`);
  if (painted.width < 10 || painted.colors < 3) {
    console.error('✗ Hero GIF is blank or nearly one color');
    failed += 1;
  } else {
    console.log('✓ Local GIF paints in the celebration');
  }

  await page.goto(`${origin}/bad`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#heroGif.gif-broken', { timeout: 5000 });
  const box = await page.locator('#heroGif').boundingBox();
  const badShot = path.join(shotDir, 'gif-broken.png');
  await page.screenshot({ path: badShot });
  if (!box || box.height < 80) {
    console.error('✗ Broken GIF left an empty stage');
    failed += 1;
  } else {
    console.log(`✓ Broken GIF shows a fallback (${Math.round(box.height)}px)`);
  }

  await browser.close();
} catch (err) {
  console.error('✗ GIF visual harness failed');
  console.error(err instanceof Error ? err.message : err);
  failed += 1;
} finally {
  server.close();
}

if (failed) {
  process.exit(1);
}
console.log('✓ GIF visual harness PASS');
