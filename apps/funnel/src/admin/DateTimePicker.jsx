import { useState, useRef, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  // 0=Sun → convert to Mon-start
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // Mon=0 … Sun=6
}

export default function DateTimePicker({ value, onChange, placeholder = 'Select date & time' }) {
  const [open, setOpen]       = useState(false);
  const [viewYear, setViewYear]   = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth()    : new Date().getMonth());
  const [selDate, setSelDate] = useState(() => value ? new Date(value) : null);
  const [hour, setHour]       = useState(() => value ? new Date(value).getHours()   : 19);
  const [minute, setMinute]   = useState(() => value ? new Date(value).getMinutes() : 0);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const triggerRef = useRef(null);

  /* close on outside click or scroll */
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, []);

  function openPicker() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const dropH = 420;
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow >= dropH ? r.bottom + 8 : r.top - dropH - 8;
      setDropPos({ top, left: r.left, width: r.width });
    }
    setOpen(o => !o);
  }

  /* sync value prop → state */
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setHour(d.getHours());
      setMinute(d.getMinutes());
    }
  }, [value]);

  const pad = n => String(n).padStart(2, '0');

  function commit(date, h, m) {
    if (!date) return;
    const d = new Date(date);
    // Build local datetime string — avoids UTC shift from toISOString()
    const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
    onChange(local);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function pickDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    setSelDate(d);
    commit(d, hour, minute);
  }

  function changeHour(h) {
    setHour(h);
    commit(selDate, h, minute);
  }
  function changeMinute(m) {
    setMinute(m);
    commit(selDate, hour, m);
  }

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const today        = new Date();

  const displayStr = selDate
    ? `${selDate.getDate()} ${MONTHS[selDate.getMonth()].slice(0,3)} ${selDate.getFullYear()}  ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
    : '';

  const isSelected = (day) =>
    selDate && selDate.getFullYear() === viewYear && selDate.getMonth() === viewMonth && selDate.getDate() === day;
  const isToday = (day) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  /* --- styles --- */
  const pill = {
    width: '100%', height: '2.8rem',
    padding: '0 14px',
    borderRadius: 12,
    border: open ? '1px solid rgba(91,33,182,0.55)' : '1px solid rgba(139,92,246,0.22)',
    background: 'rgba(237,234,248,0.40)',
    fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem',
    color: displayStr ? '#3B0764' : 'rgba(91,33,182,0.35)',
    cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    outline: 'none', transition: 'border 200ms',
    boxShadow: open ? '0 0 0 3px rgba(91,33,182,0.10)' : 'none',
  };

  const dropdown = {
    position: 'fixed',
    top: dropPos.top,
    left: dropPos.left,
    width: dropPos.width,
    background: '#fff',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 18,
    boxShadow: '0 12px 48px rgba(91,33,182,0.16)',
    zIndex: 9999, padding: '18px 16px 16px',
    fontFamily: 'Outfit, sans-serif',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button ref={triggerRef} type="button" style={pill} onClick={openPicker}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(91,33,182,0.50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {displayStr || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(91,33,182,0.40)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={dropdown}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button type="button" onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(139,92,246,0.18)', background: 'rgba(237,234,248,0.50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#3B0764' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(139,92,246,0.18)', background: 'rgba(237,234,248,0.50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(91,33,182,0.40)', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  style={{
                    height: 34, borderRadius: 9, border: 'none',
                    background: sel ? '#5B21B6' : tod ? 'rgba(139,92,246,0.12)' : 'transparent',
                    color: sel ? '#fff' : tod ? '#5B21B6' : '#3B0764',
                    fontWeight: sel ? 700 : tod ? 600 : 400,
                    fontSize: '0.84rem', cursor: 'pointer',
                    transition: 'all 150ms',
                    outline: tod && !sel ? '1.5px solid rgba(91,33,182,0.35)' : 'none',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = tod ? 'rgba(139,92,246,0.12)' : 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(139,92,246,0.10)', margin: '14px 0 12px' }} />

          {/* Time picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(91,33,182,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(91,33,182,0.55)' }}>Time</span>
            {/* Hour */}
            <select
              value={hour}
              onChange={e => changeHour(Number(e.target.value))}
              style={{ height: '2rem', padding: '0 8px', borderRadius: 9, border: '1px solid rgba(139,92,246,0.22)', background: 'rgba(237,234,248,0.40)', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', color: '#3B0764', outline: 'none', cursor: 'pointer' }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
              ))}
            </select>
            <span style={{ fontWeight: 700, color: '#5B21B6', fontSize: '1rem' }}>:</span>
            {/* Minute */}
            <select
              value={minute}
              onChange={e => changeMinute(Number(e.target.value))}
              style={{ height: '2rem', padding: '0 8px', borderRadius: 9, border: '1px solid rgba(139,92,246,0.22)', background: 'rgba(237,234,248,0.40)', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', color: '#3B0764', outline: 'none', cursor: 'pointer' }}
            >
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'rgba(91,33,182,0.40)', fontWeight: 500 }}>IST</span>
          </div>

          {/* Done button */}
          {selDate && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 14, width: '100%', height: '2.4rem',
                borderRadius: 50, border: 'none',
                background: '#5B21B6',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.88rem',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(91,33,182,0.30)',
              }}
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
}
