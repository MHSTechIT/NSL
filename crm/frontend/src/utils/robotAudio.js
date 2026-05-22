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

/* Play the clip for robot-text number `n`, instantly. Any clip already
   playing is stopped first so two robot lines never overlap. */
export function playRobotClip(n) {
  const a = _audio(ROBOT_CLIP[n]);
  if (!a) return;
  try {
    if (_current && _current !== a) { _current.pause(); _current.currentTime = 0; }
    _current = a;
    a.currentTime = 0;
    a.volume = 0.9;
    a.play().catch(() => { /* autoplay blocked until first gesture */ });
  } catch { /* no Audio API */ }
}

/* Stop whatever robot clip is currently playing. */
export function stopRobotClip() {
  try { if (_current) { _current.pause(); _current.currentTime = 0; } } catch { /* ignore */ }
  _current = null;
}
