import * as THREE from 'three';
import type { PackPalette } from './types';
import type { TimelineState } from './timeline';
import { lerp } from './timeline';

export interface OrbitalWorld {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  particles: THREE.Points;
  grid: THREE.GridHelper;
  accent: THREE.Group;
  dispose: () => void;
  resize: (w: number, h: number, surface: 'overlay' | 'panel') => void;
  update: (state: TimelineState, palette: PackPalette, surface: 'overlay' | 'panel') => void;
}

function hexColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function buildParticles(palette: PackPalette): THREE.Points {
  const count = palette.particleCount;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c0 = hexColor(palette.tint);
  const c1 = hexColor(palette.secondary);
  const c2 = hexColor(palette.tertiary);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 4 + Math.random() * 28;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.45) * 18;
    positions[i3] = Math.cos(theta) * r;
    positions[i3 + 1] = y;
    positions[i3 + 2] = Math.sin(theta) * r;

    const pick = Math.random();
    const col = pick < 0.45 ? c0 : pick < 0.75 ? c1 : c2;
    colors[i3] = col.r * palette.starBrightness;
    colors[i3 + 1] = col.g * palette.starBrightness;
    colors[i3 + 2] = col.b * palette.starBrightness;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: palette.accentMode === 'scrapbook' ? 0.09 : 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

function buildAccent(palette: PackPalette): THREE.Group {
  const group = new THREE.Group();
  const tint = hexColor(palette.tint);
  const secondary = hexColor(palette.secondary);

  if (palette.accentMode === 'grid' || palette.accentMode === 'orbit') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.04, 12, 96),
      new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.4, 0.03, 12, 96),
      new THREE.MeshBasicMaterial({ color: secondary, transparent: true, opacity: 0.35 }),
    );
    ring2.rotation.x = Math.PI / 2.1;
    ring2.rotation.z = 0.4;
    group.add(ring2);
  }

  if (palette.accentMode === 'glitch' || palette.accentMode === 'scrapbook') {
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8 + Math.random(), 0.05, 0.05),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? tint : secondary,
          transparent: true,
          opacity: 0.5,
        }),
      );
      box.position.set((i - 2) * 1.2, (i % 2) * 0.6 - 0.2, -2 + i * 0.3);
      box.rotation.z = (i - 2) * 0.15;
      group.add(box);
    }
  }

  if (palette.accentMode === 'soft') {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 32, 32),
      new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.22 }),
    );
    group.add(orb);
  }

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 24, 24),
    new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.9 }),
  );
  group.add(core);

  return group;
}

export function createWorld(
  canvas: HTMLCanvasElement,
  palette: PackPalette,
  surface: 'overlay' | 'panel',
): OrbitalWorld {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(hexColor(palette.fog), palette.fogNear, palette.fogFar);
  scene.background = hexColor(palette.fog);

  const fov = surface === 'panel' ? 58 : 48;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 2.2, 11);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(hexColor(palette.fog), 1);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  const key = new THREE.PointLight(hexColor(palette.tint), 2.2, 40);
  key.position.set(4, 6, 8);
  const fill = new THREE.PointLight(hexColor(palette.secondary), 1.2, 35);
  fill.position.set(-6, 2, 4);
  scene.add(ambient, key, fill);

  const particles = buildParticles(palette);
  scene.add(particles);

  const grid = new THREE.GridHelper(40, 40, hexColor(palette.tint), hexColor(palette.secondary));
  grid.position.y = -3.2;
  const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const m of gridMats) {
    const mat = m as THREE.Material;
    mat.transparent = true;
    mat.opacity = 0.28;
  }
  scene.add(grid);

  const accent = buildAccent(palette);
  accent.position.set(0, 0.4, 0);
  scene.add(accent);

  const resize = (w: number, h: number, surf: 'overlay' | 'panel') => {
    const width = Math.max(1, w);
    const height = Math.max(1, h);
    camera.aspect = width / height;
    camera.fov = surf === 'panel' ? 58 : 48;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const update = (state: TimelineState, pal: PackPalette, surf: 'overlay' | 'panel') => {
    const t = state.elapsed;
    particles.rotation.y = t * 0.00012 + state.swirl * 0.35;
    particles.rotation.x = Math.sin(t * 0.0002) * 0.08;
    const mat = particles.material as THREE.PointsMaterial;
    mat.opacity = lerp(0.2, 0.9, state.enter) * (1 - state.exit * 0.85);

    accent.rotation.y = t * 0.00045;
    accent.rotation.z = Math.sin(t * 0.0007) * 0.15;
    accent.scale.setScalar(lerp(0.6, 1, state.enter) * lerp(1, 0.4, state.exit));

    if (pal.accentMode === 'glitch' && state.hold > 0.2) {
      accent.position.x = (Math.random() - 0.5) * 0.08 * state.hold;
    } else {
      accent.position.x = Math.sin(t * 0.001) * 0.15;
    }

    grid.rotation.y = t * 0.00005;
    const baseZ = surf === 'panel' ? 9.5 : 11.5;
    const dollyZ = lerp(baseZ + 3.5, baseZ - 2.8, state.dolly);
    camera.position.z = dollyZ;
    camera.position.y = lerp(2.8, 1.6, state.dolly) + Math.sin(t * 0.0008) * 0.12;
    camera.lookAt(0, 0.2, 0);

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = pal.fogNear * state.fogScale;
      scene.fog.far = pal.fogFar * state.fogScale;
    }

    renderer.render(scene, camera);
  };

  const dispose = () => {
    particles.geometry.dispose();
    (particles.material as THREE.Material).dispose();
    accent.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) m.dispose();
      }
    });
    renderer.dispose();
  };

  return { scene, camera, renderer, particles, grid, accent, dispose, resize, update };
}
