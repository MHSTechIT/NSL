/* Robot voice clips — ONE preloaded audio module.
   ===================================================================
   Every caller-workspace robot line has a numbered voice clip. They are
   ALL imported and preloaded here at module load (`preload='auto'` +
   `.load()`), so calling `playRobotClip(n)` fires the clip instantly —
   no fetch-on-play lag, which is what made audio play late.

   Clip numbers match the robot-text order numbers:
     1-10  greetings (Call page)
     11-12 HOT post-call celebration
     13-20 WARM / COLD / JUNK / DEFAULT post-call celebration
     21-22 reason-card first prompts
     40-53 idle nudges, break picker, late-return, DNP, network, paused
   =================================================================== */

import v1  from '../assets/audio/voice/v1.mp3';
import v2  from '../assets/audio/voice/v2.mp3';
import v3  from '../assets/audio/voice/v3.mp3';
import v4  from '../assets/audio/voice/v4.mp3';
import v5  from '../assets/audio/voice/v5.mp3';
import v6  from '../assets/audio/voice/v6.mp3';
import v7  from '../assets/audio/voice/v7.mp3';
import v8  from '../assets/audio/voice/v8.mp3';
import v9  from '../assets/audio/voice/v9.mp3';
import v10 from '../assets/audio/voice/v10.mp3';
import h1  from '../assets/audio/hot/h1.mp3';
import h2  from '../assets/audio/hot/h2.mp3';
import a13 from '../assets/audio/robot/13.mp3';
import a14 from '../assets/audio/robot/14.mp3';
import a15 from '../assets/audio/robot/15.mp3';
import a16 from '../assets/audio/robot/16.mp3';
import a17 from '../assets/audio/robot/17.mp3';
import a18 from '../assets/audio/robot/18.mp3';
import a19 from '../assets/audio/robot/19.mp3';
import a20 from '../assets/audio/robot/20.mp3';
import a21 from '../assets/audio/robot/21.mp3';
import a22 from '../assets/audio/robot/22.mp3';
import a40 from '../assets/audio/robot/40.mp3';
import a41 from '../assets/audio/robot/41.mp3';
import a42 from '../assets/audio/robot/42.mp3';
import a43 from '../assets/audio/robot/43.mp3';
import a44 from '../assets/audio/robot/44.mp3';
import a45 from '../assets/audio/robot/45.mp3';
import a46 from '../assets/audio/robot/46.mp3';
import a47 from '../assets/audio/robot/47.mp3';
import a48 from '../assets/audio/robot/48.mp3';
import a49 from '../assets/audio/robot/49.mp3';
import a50 from '../assets/audio/robot/50.mp3';
import a51 from '../assets/audio/robot/51.mp3';
import a52 from '../assets/audio/robot/52.mp3';
import a53 from '../assets/audio/robot/53.mp3';

/* Clip number → asset URL. */
export const ROBOT_CLIP = {
  1: v1, 2: v2, 3: v3, 4: v4, 5: v5, 6: v6, 7: v7, 8: v8, 9: v9, 10: v10,
  11: h1, 12: h2,
  13: a13, 14: a14, 15: a15, 16: a16, 17: a17, 18: a18, 19: a19, 20: a20,
  21: a21, 22: a22,
  40: a40, 41: a41, 42: a42, 43: a43, 44: a44, 45: a45, 46: a46, 47: a47,
  48: a48, 49: a49, 50: a50, 51: a51, 52: a52, 53: a53,
};

/* One preloaded <audio> element per clip, created + buffered at module
   load so the first play has zero fetch/decode lag. */
const _cache = new Map();
function _audio(src) {
  if (!src) return null;
  let a = _cache.get(src);
  if (!a) {
    try {
      a = new Audio(src);
      a.preload = 'auto';
      a.load();
      _cache.set(src, a);
    } catch { return null; }
  }
  return a;
}
// Warm the whole cache now.
Object.values(ROBOT_CLIP).forEach(_audio);

let _current = null;

/* ── Per-user volume preference ──────────────────────────────────────
   Persisted in localStorage so the caller's choice survives reloads
   and follows them across tabs. Range 0–1 (0 = muted). Default 0.9
   matches the legacy hardcoded value. */
const VOLUME_KEY     = 'mhs_robot_volume';
const VOLUME_DEFAULT = 0.9;
const VOLUME_EVENT   = 'mhs:robot-volume';

function _readVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null) return VOLUME_DEFAULT;
    const v = Number(raw);
    if (!Number.isFinite(v)) return VOLUME_DEFAULT;
    return Math.min(1, Math.max(0, v));
  } catch { return VOLUME_DEFAULT; }
}
let _volume = _readVolume();

export function getRobotVolume() { return _volume; }

/* Set the caller-wide robot voice volume. Persists to localStorage,
   immediately updates any currently-playing clip, and fires a window
   event so React components subscribed via the hook below re-render. */
export function setRobotVolume(v) {
  const next = Math.min(1, Math.max(0, Number(v) || 0));
  _volume = next;
  try { localStorage.setItem(VOLUME_KEY, String(next)); } catch { /* ignore */ }
  if (_current) {
    try { _current.volume = next; } catch { /* ignore */ }
  }
  try { window.dispatchEvent(new CustomEvent(VOLUME_EVENT, { detail: next })); } catch { /* ignore */ }
}

/* Cross-tab sync: respond to localStorage changes from other tabs so
   adjusting volume in one place updates everywhere. */
try {
  window.addEventListener('storage', (e) => {
    if (e.key !== VOLUME_KEY) return;
    _volume = _readVolume();
    try { window.dispatchEvent(new CustomEvent(VOLUME_EVENT, { detail: _volume })); } catch { /* ignore */ }
  });
} catch { /* SSR / no window */ }

export const ROBOT_VOLUME_EVENT = VOLUME_EVENT;

/* ── Account-paused audio mute ────────────────────────────────────────
   When the caller's account is paused, EVERYTHING audible has to stop
   — leftover greetings, nudges, reason-card clips, even RobotGuide
   speech-bubble audio in flight. CallerShell calls setAccountPaused
   (true) the moment isActive flips false, then false again on resume.

   While paused:
     • playRobotClip(n) becomes a no-op.
     • _current (whatever clip was last started) is stopped immediately.
     • RobotGuide imports isAccountPaused() and refuses to start a new
       clip unless variant === 'overlay' (the paused-account robot
       itself, which IS allowed to speak its "contact admin" line). */
let _accountPaused = false;
export function isAccountPaused() { return _accountPaused; }
export function setAccountPaused(paused) {
  const next = !!paused;
  if (next === _accountPaused) return;
  _accountPaused = next;
  if (_accountPaused) {
    try { if (_current) { _current.pause(); _current.currentTime = 0; } } catch { /* ignore */ }
    _current = null;
  }
}

/* Wire any external Audio element (one created outside this module —
   e.g. RobotGuide's _audioCache or CallModule's greeting Audio) to the
   persisted robot volume. Sets the current value immediately and
   subscribes to live slider changes so the user can drag the volume
   and HEAR it update on in-flight clips, not just the next one.

   Returns a teardown function — callers should invoke it when the
   audio element is no longer needed (component unmount, etc.) so we
   don't leak listeners. */
export function bindAudioToRobotVolume(audio) {
  if (!audio) return () => {};
  try { audio.volume = _volume; } catch { /* ignore */ }
  const sync = () => { try { audio.volume = _volume; } catch { /* ignore */ } };
  try { window.addEventListener(VOLUME_EVENT, sync); } catch { /* SSR */ }
  return () => {
    try { window.removeEventListener(VOLUME_EVENT, sync); } catch { /* ignore */ }
  };
}

/* Play the clip for robot-text number `n`, instantly. Any clip already
   playing is stopped first so two robot lines never overlap. */
export function playRobotClip(n) {
  // Account paused → silent. Stops nudges / greetings / reason-card
  // clips from firing while the paused overlay owns the screen.
  if (_accountPaused) return;
  const a = _audio(ROBOT_CLIP[n]);
  if (!a) return;
  try {
    if (_current && _current !== a) { _current.pause(); _current.currentTime = 0; }
    _current = a;
    a.currentTime = 0;
    a.volume = _volume;
    if (_volume <= 0) return; // muted → don't bother starting playback
    a.play().catch(() => { /* autoplay blocked until first gesture */ });
  } catch { /* no Audio API */ }
}

/* Stop whatever robot clip is currently playing. */
export function stopRobotClip() {
  try { if (_current) { _current.pause(); _current.currentTime = 0; } } catch { /* ignore */ }
  _current = null;
}
