import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';

import idleData from '../assets/bot/robot-idle.json';
import { lockArmsDown, normalizeLoop } from '../utils/patchRobotArm';

/* ──────────────────────────────────────────────────────────────────────────
   RobotGuide — the shared "robot narrates the caller workflow" component.

   Renders a robot Lottie + a speech bubble. The bubble TEXT auto-fades after
   `bubbleHideMs` (default 10 000 ms) — the robot and the optional `card`
   slot stay put; only the words disappear. Passing a new `text` (or bumping
   `pulse`) re-shows the bubble and replays the audio, so repeat-nudges work
   by changing the key/text.

   Two layouts:
     variant="overlay" — full-screen dim backdrop, centred robot+bubble+card
                         (reason pickers, break menu, paused screen).
     variant="corner"  — floating bottom-right bubble + small robot
                         (transient idle / network nudges).

   Audio is cached per-src at module scope and created with preload="auto"
   so repeat plays of the same clip don't re-fetch / re-decode.
   ────────────────────────────────────────────────────────────────────────── */

/* ONE robot everywhere — the exact robot-idle.json the Call page uses.
   The `mood` prop is kept for API stability but no longer swaps the
   animation: every robot position renders this same character, only the
   size / placement varies per call site. */
const ROBOT = normalizeLoop(lockArmsDown(idleData));

/* Module-level audio cache. getAudio() returns a buffered Audio element per
   src; preloadRobotAudio() lets callers warm the cache at module load so the
   first play has no fetch/decode lag. */
const _audioCache = new Map();
function getAudio(src) {
  if (!src) return null;
  let a = _audioCache.get(src);
  if (!a) {
    try {
      a = new Audio(src);
      a.preload = 'auto';
      a.load();
      _audioCache.set(src, a);
    } catch { return null; }
  }
  return a;
}
export function preloadRobotAudio(srcs = []) {
  srcs.forEach(s => getAudio(s));
}

export default function RobotGuide({
  mood = 'idle',
  text,
  audioSrc,
  variant = 'corner',
  card = null,
  bubbleHideMs = 10000,
  pulse = 0,            // bump to re-show the bubble + replay audio for the same text
  onClose,
}) {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const animationData = ROBOT;   // same robot for every mood

  /* Re-show the bubble and replay the clip whenever the text or pulse changes. */
  useEffect(() => {
    if (!text) return undefined;
    setBubbleVisible(true);

    // Play the (preloaded) audio once.
    const a = getAudio(audioSrc);
    if (a) {
      try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* ignore */ }
    }

    // Fade the bubble text out after bubbleHideMs.
    const hideId = setTimeout(() => setBubbleVisible(false), bubbleHideMs);
    return () => clearTimeout(hideId);
  }, [text, audioSrc, pulse, bubbleHideMs]);

  const robotPx = variant === 'overlay' ? 180 : 84;

  const robot = (
    <div style={{ width: robotPx, height: robotPx, flexShrink: 0, pointerEvents: 'none' }}>
      <Lottie
        key={`robot-${pulse}`}
        animationData={animationData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </div>
  );

  const bubble = text ? (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        color: '#3B0764',
        padding: '14px 22px',
        borderRadius: 22,
        maxWidth: 'min(420px, 90vw)',
        textAlign: 'center',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.35,
        boxShadow: '0 12px 32px rgba(15,0,40,0.35), 0 2px 8px rgba(15,0,40,0.18)',
        marginBottom: variant === 'overlay' ? -10 : 0,
        opacity: bubbleVisible ? 1 : 0,
        transform: bubbleVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 420ms ease, transform 420ms ease',
        pointerEvents: 'none',
      }}
    >
      {text}
      {/* Tail — points at the robot's head. Overlay centres the bubble over
          the robot, so the tail sits at the bubble's centre. The corner
          layout right-aligns a (usually wider) bubble above an 84px robot,
          so the tail must sit over the ROBOT's centre instead: robotPx/2 in
          from the shared right edge, less the tail's 12px half-width. */}
      <div style={{
        position: 'absolute', bottom: -10,
        width: 0, height: 0,
        ...(variant === 'overlay'
          ? { left: '50%', transform: 'translateX(-50%)' }
          : { right: robotPx / 2 - 12 }),
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: '12px solid #fff',
        filter: 'drop-shadow(0 4px 4px rgba(15,0,40,0.18))',
      }} />
    </div>
  ) : null;

  if (variant === 'overlay') {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9600,
          background: 'rgba(15,0,40,0.55)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', gap: 4,
        }}
      >
        {bubble}
        {robot}
        {card && <div style={{ marginTop: 8, width: '100%', maxWidth: 440 }}>{card}</div>}
      </div>
    );
  }

  /* corner variant — floating bottom-right */
  return (
    <div
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 9400,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        pointerEvents: 'none',
      }}
    >
      {bubble}
      {robot}
      {card && <div style={{ pointerEvents: 'auto' }}>{card}</div>}
    </div>
  );
}
