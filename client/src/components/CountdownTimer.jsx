import { useState, useEffect, useRef } from 'react';
import { useFunnel } from '../context/FunnelContext';
import { getCountdownParts } from '../utils/time';
import { t } from '../translations';
import { FlipUnit } from './FlipCard';

let _audio = null;
let _stopped = false;

export function stopTick() {
  _stopped = true;
  if (_audio) { _audio.pause(); _audio.currentTime = 0; }
}

export default function CountdownTimer({ floating = false }) {
  const { state } = useFunnel();
  const lang = state.lang;
  const [parts, setParts] = useState(getCountdownParts(state.webinarConfig.next_webinar_at));
  const audioRef = useRef(null);

  // Pre-load audio once
  useEffect(() => {
    const audio = new Audio('/tick.mp3');
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;
    _audio = audio;
    return () => { _audio = null; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setParts(getCountdownParts(state.webinarConfig.next_webinar_at));
      // Play tick — reset currentTime so rapid calls overlap cleanly
      try {
        const a = audioRef.current;
        if (a && !_stopped) { a.currentTime = 0; a.play().catch(() => {}); }
      } catch (_) {}
    }, 1000);
    return () => clearInterval(id);
  }, [state.webinarConfig.next_webinar_at]);

  if (parts.isDuringSession) {
    return (
      <div className="rounded-card px-4 py-3 text-center font-sans text-sm font-semibold text-purple bg-purple-50 border border-purple-100">
        {t.screen1A.duringSession[lang]}
      </div>
    );
  }

  const isNear = parts.isNearStart;
  const totalSec = parts.hrs * 3600 + parts.min * 60 + parts.sec;
  const isUrgent = totalSec > 0 && totalSec < 12 * 3600;
  const units = [
    { val: parts.hrs,  label: t.screen1A.hrs[lang] },
    { val: parts.min,  label: t.screen1A.min[lang] },
    { val: parts.sec,  label: t.screen1A.sec[lang] },
  ];

  return (
    <div className={`rounded-card p-4 ${isNear ? 'animate-pulse' : ''}`} style={{ background: floating ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: floating ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.6)', boxShadow: floating ? '0 4px 24px rgba(91,33,182,0.10)' : '0 4px 24px rgba(91,33,182,0.07)' }}>
      <p className="font-sans text-center text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: isUrgent ? '#991B1B' : undefined }} >
        {isNear ? t.screen1A.nearStart[lang] : t.screen1A.timerLabel[lang]}
      </p>

      {/* Single row — all 4 units */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 3 }}>
        {units.map(({ val, label }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <FlipUnit value={val} label={label} size="lg" urgent={isUrgent} />
            {i < units.length - 1 && (
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                color: isUrgent ? 'rgba(153,27,27,0.60)' : 'rgba(91,33,182,0.5)',
                lineHeight: 1,
                marginTop: 14,
                userSelect: 'none',
              }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
