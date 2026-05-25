import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';

import idleData from '../assets/bot/robot-idle.json';
import { lockArmsDown, normalizeLoop } from '../utils/patchRobotArm';
import { useTimerSettings } from '../context/TimerSettingsContext';
import { getRobotVolume, ROBOT_VOLUME_EVENT, isAccountPaused } from '../utils/robotAudio';

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
      a.volume  = getRobotVolume();   // honour the persisted slider on creation
      a.load();
      _audioCache.set(src, a);
    } catch { return null; }
  }
  return a;
}

/* Live volume sync — when the caller drags the Robot Voice slider in the
   account dropdown, update every cached Audio so anything currently
   playing AND future plays both reflect the new level. Single
   module-level listener (not per-instance) so we don't leak. */
try {
  window.addEventListener(ROBOT_VOLUME_EVENT, () => {
    const v = getRobotVolume();
    _audioCache.forEach(a => { try { a.volume = v; } catch { /* ignore */ } });
  });
} catch { /* SSR / no window */ }
export function preloadRobotAudio(srcs = []) {
  srcs.forEach(s => getAudio(s));
}

/* Pause every RobotGuide-owned audio element. Useful when the caller
   takes a hard action (e.g. presses Start Auto Call) and the prior
   corner-robot voice would otherwise tail off into the next screen's
   audio. Independent of robotAudio.js → call stopRobotClip() too if
   you want full silence. */
export function stopAllRobotGuideAudio() {
  _audioCache.forEach(a => {
    try { a.pause(); a.currentTime = 0; } catch { /* ignore */ }
  });
}

export default function RobotGuide({
  mood = 'idle',
  text,
  audioSrc,
  variant = 'corner',
  card = null,
  bubbleHideMs,
  pulse = 0,            // bump to re-show the bubble + replay audio for the same text
  onClose,
}) {
  const t = useTimerSettings();
  // Default the bubble duration to the admin-controlled setting when the
  // caller didn't pass an explicit override.
  const effBubbleHideMs = bubbleHideMs != null ? bubbleHideMs : t.robotBubbleHideMs;
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const animationData = ROBOT;   // same robot for every mood

  /* Re-show the bubble and replay the clip whenever the text or pulse changes. */
  useEffect(() => {
    if (!text) return undefined;
    setBubbleVisible(true);

    // Play the (preloaded) audio once. Re-sync volume to the latest
    // slider value (defensive — the module-level listener already does
    // this, but a brand-new audio cached this render hasn't been touched
    // by an event yet). When the account is paused, only the fullscreen
    // paused-overlay robot is allowed to speak — every other corner /
    // network-recovered / etc. RobotGuide stays silent so the paused
    // state isn't drowned out by leftover nudge clips.
    const a = getAudio(audioSrc);
    const allowedWhilePaused = variant === 'overlay';
    if (a && (!isAccountPaused() || allowedWhilePaused)) {
      try {
        a.volume = getRobotVolume();
        a.currentTime = 0;
        if (a.volume > 0) a.play().catch(() => {});
      } catch { /* ignore */ }
    }

    // Fade the bubble text out after the effective bubble-hide duration.
    const hideId = setTimeout(() => setBubbleVisible(false), effBubbleHideMs);
    return () => {
      clearTimeout(hideId);
      // Stop the clip when this robot unmounts (or text/pulse changes) so a
      // nudge never bleeds over the next robot's voice.
      try { if (a) a.pause(); } catch { /* ignore */ }
    };
  }, [text, audioSrc, pulse, effBubbleHideMs]);

  // Corner robot bumped from 84 → 116 so the floating bot reads at a
  // glance on review pages. Overlay variant (paused-account fullscreen)
  // stays at 180 — it's already prominently centred.
  const robotPx = variant === 'overlay' ? 180 : 116;

  const robot = (
    <div style={{
      position: 'relative',
      width: robotPx, height: robotPx, flexShrink: 0, pointerEvents: 'none',
    }}>
      {/* Halo behind the bot — TWO stacked layers so the bot reads
         clearly against the lavender page background:
           1. Outer soft purple bloom — wider, blurred, slow-pulsing.
              Gives the bot weight on the page.
           2. Inner bright white core — tighter, more opaque, faster
              pulse offset. Lights the bot itself like a spotlight.
         Both layers pulse independently for an "alive" feel. */}
      <style>{`
        /* Glow opacities halved to ~50% so the halo lifts the bot
           against the lavender background without dominating it. */
        @keyframes mhs-robot-halo-outer {
          0%, 100% { opacity: 0.42; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.50; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes mhs-robot-halo-inner {
          0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(0.96); }
          50%      { opacity: 0.50; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
      {/* Outer bloom */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width:  Math.round(robotPx * 1.9),
          height: Math.round(robotPx * 1.9),
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: variant === 'overlay'
            ? 'radial-gradient(closest-side, rgba(167,139,250,0.55) 0%, rgba(124,58,237,0.30) 40%, rgba(15,0,40,0) 75%)'
            : 'radial-gradient(closest-side, rgba(167,139,250,0.75) 0%, rgba(124,58,237,0.40) 38%, rgba(91,33,182,0) 75%)',
          filter: 'blur(8px)',
          animation: 'mhs-robot-halo-outer 2.6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Inner bright core */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width:  Math.round(robotPx * 1.2),
          height: Math.round(robotPx * 1.2),
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: variant === 'overlay'
            ? 'radial-gradient(closest-side, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.20) 55%, rgba(255,255,255,0) 80%)'
            : 'radial-gradient(closest-side, rgba(255,255,255,0.95) 0%, rgba(237,233,254,0.55) 50%, rgba(167,139,250,0) 80%)',
          filter: 'blur(2px)',
          animation: 'mhs-robot-halo-inner 2.2s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
        <Lottie
          key={`robot-${pulse}`}
          animationData={animationData}
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
      </div>
    </div>
  );

  const bubble = text ? (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        color: '#3B0764',
        // Bubble trimmed for the corner variant — smaller padding, font
        // and width so it doesn't dwarf the now-larger floating robot.
        // Overlay variant keeps its more prominent sizing since it sits
        // above a 180px bot. Computed via the same `variant` branch.
        padding: variant === 'overlay' ? '14px 22px' : '10px 16px',
        borderRadius: variant === 'overlay' ? 22 : 18,
        maxWidth: variant === 'overlay' ? 'min(420px, 90vw)' : 'min(320px, 86vw)',
        textAlign: 'center',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        fontSize:   variant === 'overlay' ? '0.98rem' : '0.84rem',
        lineHeight: 1.32,
        boxShadow: '0 12px 32px rgba(15,0,40,0.35), 0 2px 8px rgba(15,0,40,0.18)',
        marginBottom: variant === 'overlay' ? -10 : 0,
        opacity: bubbleVisible ? 1 : 0,
        transform: bubbleVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: `opacity ${t.robotBubbleFadeMs}ms ease, transform ${t.robotBubbleFadeMs}ms ease`,
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
