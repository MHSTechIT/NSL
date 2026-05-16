// One-shot script: reads the supplied AI-robot Lottie from Downloads and
// writes three variants (idle / happy / thinking) into the CRM assets folder.
// Run from repo root: `node scripts/build-bot-lotties.mjs`
//
// Each variant is a structural edit of the original JSON. No path-data is
// rewritten — only keyframe transforms (scale / rotation) and shape fills.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here    = dirname(fileURLToPath(import.meta.url));
const SRC     = 'C:\\Users\\PRO SERV 3\\Downloads\\Ai Robot Animation.json';
const OUT_DIR = resolve(here, '..', 'apps', 'crm', 'src', 'assets', 'bot');

const raw = readFileSync(SRC, 'utf8');

// Helpers --------------------------------------------------------------
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function find(layers, ind) { return layers.find(l => l.ind === ind); }

// ── Brand recolor pass ──────────────────────────────────────────────────
// The original Lottie is grayscale-shaded (whites / grays only). On the
// CRM's lavender `#EDEAF8` background that's almost invisible. Walk the
// JSON tree and remap every *grayscale* fill / stroke / gradient stop onto
// a purple ramp tuned to brand colors:
//   gray 0.0 → deep purple  #1F0A3D
//   gray 1.0 → light lavender #CDBEFF
// Anything non-grayscale (eye colors, accent hues) is left alone so
// per-mood eye colors keep their meaning.
const DEEP  = [0.122, 0.039, 0.239];   // #1F0A3D
const LIGHT = [0.804, 0.745, 1.000];   // #CDBEFF
function tintGray(v) {
  return [
    DEEP[0] + (LIGHT[0] - DEEP[0]) * v,
    DEEP[1] + (LIGHT[1] - DEEP[1]) * v,
    DEEP[2] + (LIGHT[2] - DEEP[2]) * v,
  ];
}
function isGray(rgb) {
  if (!Array.isArray(rgb) || rgb.length < 3) return false;
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) < 0.04;          // tolerance for "essentially grayscale"
}
function recolorBrand(node) {
  if (Array.isArray(node)) { node.forEach(recolorBrand); return; }
  if (typeof node !== 'object' || node === null) return;

  // Solid fill / stroke colours
  if ((node.ty === 'fl' || node.ty === 'st') && node.c && Array.isArray(node.c.k)) {
    const rgb = node.c.k;
    if (rgb.length >= 3 && isGray(rgb)) {
      const tinted = tintGray(rgb[0]);
      node.c.k = rgb.length === 4 ? [...tinted, rgb[3]] : tinted;
    }
  }
  // Gradient fill — g.k.k is a flat array [pos, r, g, b, pos, r, g, b, ...]
  if (node.ty === 'gf' && node.g && node.g.k && Array.isArray(node.g.k.k)) {
    const stops = node.g.k.k;
    const next  = [];
    for (let i = 0; i < stops.length; i += 4) {
      const pos = stops[i];
      const rgb = [stops[i + 1], stops[i + 2], stops[i + 3]];
      const tinted = isGray(rgb) ? tintGray(rgb[0]) : rgb;
      next.push(pos, ...tinted);
    }
    node.g.k.k = next;
  }
  for (const key of Object.keys(node)) recolorBrand(node[key]);
}
// Inside an eye-layer's shape group, find the inner Fill ({ty:"fl"}) and
// replace its colour (`c.k`). Each eye layer has one shape group ("gr") with
// a "fl" inside its `it` array.
function setEyeFillColour(layer, rgb /* [r,g,b] */) {
  for (const sh of layer.shapes) {
    if (sh.ty !== 'gr' || !Array.isArray(sh.it)) continue;
    for (const item of sh.it) {
      if (item.ty === 'fl' && item.c && Array.isArray(item.c.k)) {
        // Preserve alpha if present (Lottie usually has 3-tuple; some 4-tuple).
        if (item.c.k.length === 4) item.c.k = [...rgb, item.c.k[3]];
        else                       item.c.k = [...rgb];
      }
    }
  }
}

// The generic recolor maps the face screen (originally near-black) to mid
// purple, which kills contrast against the cyan/green eyes. Force the screen
// layer (ind:5 — the dark face plate with the outer head curve) to deep
// purple after the generic pass so the eyes still pop dramatically.
function darkenFacePlate(j) {
  const face = find(j.layers, 5);
  if (!face) return;
  const FACE_DARK = [0.10, 0.06, 0.22];   // #1A0F38 — inner rect (deep)
  const FACE_RIM  = [0.16, 0.10, 0.30];   // #29194D — outer curve (slightly lighter)
  let idx = 0;
  for (const sh of face.shapes || []) {
    if (sh.ty !== 'gr' || !Array.isArray(sh.it)) continue;
    const target = idx === 0 ? FACE_RIM : FACE_DARK;   // group 0 = outer curve, 1 = inner rect
    for (const item of sh.it) {
      if (item.ty === 'fl' && item.c && Array.isArray(item.c.k)) {
        if (item.c.k.length === 4) item.c.k = [...target, item.c.k[3]];
        else                       item.c.k = [...target];
      }
    }
    idx++;
  }
}

// ── 1. IDLE — verbatim copy of the original ──────────────────────────────
writeFileSync(resolve(OUT_DIR, 'robot-idle.json'), raw, 'utf8');

// ── 2. HAPPY ─────────────────────────────────────────────────────────────
// • Eyes scale-y squashed + rotated outward → smiling-arc impression
// • Eye fill warmed up (cyan still, slightly brighter)
// • Head bob: leave as-is (the original already has a gentle bounce)
{
  const j = JSON.parse(raw);
  const eyeL = find(j.layers, 3);   // left eye rect
  const eyeR = find(j.layers, 4);   // right eye rect

  // Squash + rotate each eye via its outer transform (`ks`).
  // Outer scale `ks.s.k = [100,100,100]` → squash y to 35 to make smile-arc.
  if (eyeL?.ks?.s) eyeL.ks.s = { a: 0, k: [100, 35, 100], ix: 6 };
  if (eyeR?.ks?.s) eyeR.ks.s = { a: 0, k: [100, 35, 100], ix: 6 };
  // Outer rotation: tilt outward edges down a bit for the smile-curve look.
  if (eyeL?.ks?.r) eyeL.ks.r = { a: 0, k:  12, ix: 10 };
  if (eyeR?.ks?.r) eyeR.ks.r = { a: 0, k: -12, ix: 10 };

  // Brighter cyan in both eyes.
  if (eyeL) setEyeFillColour(eyeL, [0.35, 0.70, 1.00]);
  if (eyeR) setEyeFillColour(eyeR, [0.35, 0.70, 1.00]);

  writeFileSync(resolve(OUT_DIR, 'robot-happy.json'), JSON.stringify(j), 'utf8');
}

// ── 3. THINKING ──────────────────────────────────────────────────────────
// • Head root (ind:7) constant tilt +12°
// • Left eye half-closed (scale-y 50)
// • Both eyes green tint
// • Antenna precomp (ind:11) slowed down by `sr` time-stretch
{
  const j = JSON.parse(raw);
  const head  = find(j.layers, 7);    // head/body root
  const eyeL  = find(j.layers, 3);
  const eyeR  = find(j.layers, 4);
  const halo  = find(j.layers, 11);   // gradient precomp

  if (head?.ks?.r) head.ks.r = { a: 0, k: 12, ix: 10 };

  // Half-close left eye only — "pondering"
  if (eyeL?.ks?.s) eyeL.ks.s = { a: 0, k: [100, 50, 100], ix: 6 };

  // Both eyes soft green
  if (eyeL) setEyeFillColour(eyeL, [0.40, 0.85, 0.55]);
  if (eyeR) setEyeFillColour(eyeR, [0.40, 0.85, 0.55]);

  // Slow the antenna halo pulse: sr is layer time-stretch (1 = realtime, >1 = slower).
  if (halo) halo.sr = 1.6;

  writeFileSync(resolve(OUT_DIR, 'robot-thinking.json'), JSON.stringify(j), 'utf8');
}

// ── 4. SAD ───────────────────────────────────────────────────────────────
// • Eyes rotated INWARD (opposite of happy) → frown-arc look
// • Eye scale-y squashed
// • Eye colour dimmed to dull desaturated blue (sad palette)
// • Head static rotation tilted slightly down (negative)
// • Antenna halo slowed
{
  const j = JSON.parse(raw);
  const head = find(j.layers, 7);
  const eyeL = find(j.layers, 3);
  const eyeR = find(j.layers, 4);
  const halo = find(j.layers, 11);

  if (eyeL?.ks?.s) eyeL.ks.s = { a: 0, k: [100, 35, 100], ix: 6 };
  if (eyeR?.ks?.s) eyeR.ks.s = { a: 0, k: [100, 35, 100], ix: 6 };
  // Inverted rotation vs. happy — inner corners drop, outer corners lift.
  if (eyeL?.ks?.r) eyeL.ks.r = { a: 0, k: -12, ix: 10 };
  if (eyeR?.ks?.r) eyeR.ks.r = { a: 0, k:  12, ix: 10 };

  // Dull desaturated blue — keeps the bot recognisable, removes the
  // bright cyan "happy" feel.
  if (eyeL) setEyeFillColour(eyeL, [0.30, 0.45, 0.65]);
  if (eyeR) setEyeFillColour(eyeR, [0.30, 0.45, 0.65]);

  // Head droops slightly forward / down.
  if (head?.ks?.r) head.ks.r = { a: 0, k: -6, ix: 10 };

  if (halo) halo.sr = 1.8;

  writeFileSync(resolve(OUT_DIR, 'robot-sad.json'), JSON.stringify(j), 'utf8');
}

console.log('Wrote 3 Lottie variants to', OUT_DIR);
