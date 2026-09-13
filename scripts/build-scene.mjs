#!/usr/bin/env node
/**
 * Bundle Orbital webview scene runtime (Three.js) into media/webview/scene.bundle.js
 */
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'media', 'webview', 'scene', 'boot.ts');
const outfile = path.join(root, 'media', 'webview', 'scene.bundle.js');

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outfile,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  logLevel: 'info',
});

console.log(`✓ Scene bundle → ${path.relative(root, outfile)}`);
