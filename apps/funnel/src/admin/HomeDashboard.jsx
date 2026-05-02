import { useState, useEffect, useCallback } from 'react';

/* ── Stat box definitions (funnel order) ── */
const STAT_BOXES = [
  {
    key: 'cta_clicked',
    label: 'Start Registration',
    sub: 'CTA Button',
    icon: '🚀',
    color: '#5B21B6',
    bg: 'rgba(91,33,182,0.08)',
  },
  {
    key: '__sugar__',          // combined: sugar_150_250 + sugar_250_plus
    label: 'Sugar Level Selected',
    sub: '150–250 + 250+ mg/dL',
    icon: '🩸',
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    combined: ['sugar_150_250', 'sugar_250_plus'],
  },
  {
    key: 'disqualified_no_diabetes',
    label: 'No Diabetes',
    sub: 'Disqualified',
    icon: '❌',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.10)',
  },
  {
    key: 'tamil_yes',
    label: 'Tamil: Yes',
    sub: 'Language Qualified',
    icon: '✅',
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
  {
    key: 'tamil_no',
    label: 'Tamil: No',
    sub: 'Language Disqualified',
    icon: '🚫',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.10)',
  },
  {
    key: 'duration_new',
    label: 'Duration: < 1 Year',
    sub: 'Screen 3',
    icon: '⏱',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    key: 'duration_mid',
    label: 'Duration: 1–5 Years',
    sub: 'Screen 3',
    icon: '⏱',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    key: 'duration_long',
    label: 'Duration: 5+ Years',
    sub: 'Screen 3',
    icon: '⏱',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    key: 'registration_submitted',
    label: 'Registration Submitted',
    sub: 'Form completed',
    icon: '📋',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    key: 'wa_join_clicked',
    label: 'WhatsApp Join Clicked',
    sub: 'Group link opened',
    icon: '💬',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.08)',
  },
];

/* ── Funnel drop-off steps ── */
const FUNNEL_STEPS = [
  { label: 'CTA Clicked',         keys: ['cta_clicked'] },
  { label: 'Sugar Selected',      keys: ['sugar_150_250', 'sugar_250_plus'] },
  { label: 'Tamil: Yes',          keys: ['tamil_yes'] },
  { label: 'Duration Selected',   keys: ['duration_new', 'duration_mid', 'duration_long'] },
  { label: 'Registered',          keys: ['registration_submitted'] },
  { label: 'Joined WhatsApp',     keys: ['wa_join_clicked'] },
];

/* ── Helper: format ISO → readable date ── */
function fmtSession(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/* ── Skeleton box ── */
function SkeletonBox() {
  return (
    <div style={{
      borderRadius: 16, border: '1px solid rgba(147,51,234,0.10)',
      background: 'rgba(237,234,248,0.60)', padding: '20px 16px',
      minHeight: 110,
      animation: 'dashPulse 1.4s ease-in-out infinite',
    }} />
  );
}

/* ── Single stat box ── */
function StatBox({ box, counts }) {
  let count = 0;
  if (box.combined) {
    count = box.combined.reduce((s, k) => s + (counts[k] || 0), 0);
  } else {
    count = counts[box.key] || 0;
  }

  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid rgba(147,51,234,0.12)',
      background: '#fff',
      padding: '18px 16px 16px',
      boxShadow: '0 2px 12px rgba(91,33,182,0.07)',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'box-shadow 200ms',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: box.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
      }}>
        {box.icon}
      </div>
      <div style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: '1.9rem', fontWeight: 800,
        color: box.color, lineHeight: 1,
      }}>
        {count.toLocaleString()}
      </div>
      <div>
        <div style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '0.80rem', fontWeight: 700,
          color: '#3B0764', lineHeight: 1.2,
        }}>
          {box.label}
        </div>
        <div style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '0.68rem', fontWeight: 500,
          color: 'rgba(91,33,182,0.50)', marginTop: 2,
        }}>
          {box.sub}
        </div>
      </div>
    </div>
  );
}

/* ── Date pill button ── */
function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 50, border: 'none',
        fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', transition: 'all 150ms',
        background: active ? '#5B21B6' : 'rgba(91,33,182,0.08)',
        color: active ? '#fff' : 'rgba(91,33,182,0.70)',
        boxShadow: active ? '0 2px 8px rgba(91,33,182,0.30)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

/* ══════════════════ Main component ══════════════════ */
export default function HomeDashboard({ token }) {
  const [counts, setCounts]       = useState({});
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const [dateRange, setDateRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]   = useState('');
  const [webinarAt, setWebinarAt] = useState('');

  const fetchDashboard = useCallback(async () => {
    setError('');
    const params = new URLSearchParams();

    if (dateRange === 'today') {
      const d = new Date().toISOString().slice(0, 10);
      params.set('from', d); params.set('to', d);
    } else if (dateRange === 'week') {
      const to = new Date();
      const from = new Date(to); from.setDate(from.getDate() - 6);
      params.set('from', from.toISOString().slice(0, 10));
      params.set('to',   to.toISOString().slice(0, 10));
    } else if (dateRange === 'month') {
      const to = new Date();
      const from = new Date(to.getFullYear(), to.getMonth(), 1);
      params.set('from', from.toISOString().slice(0, 10));
      params.set('to',   to.toISOString().slice(0, 10));
    } else if (dateRange === 'custom' && customFrom) {
      params.set('from', customFrom);
      if (customTo) params.set('to', customTo);
    }
    if (webinarAt) params.set('webinar_at', webinarAt);

    try {
      const res = await fetch(`/api/admin/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setCounts(json.counts || {});
      setSessions(json.sessions || []);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    } catch (err) {
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, dateRange, customFrom, customTo, webinarAt]);

  /* Initial load */
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* Auto-refresh every 30s */
  useEffect(() => {
    const id = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  /* ── Funnel drop-off data ── */
  const funnelData = FUNNEL_STEPS.map(step => ({
    label: step.label,
    count: step.keys.reduce((s, k) => s + (counts[k] || 0), 0),
  }));

  const inputStyle = {
    height: '2rem', borderRadius: 8, border: '1px solid rgba(91,33,182,0.20)',
    padding: '0 10px', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem',
    color: '#3B0764', outline: 'none', background: '#fff',
  };

  const selectStyle = {
    ...inputStyle, cursor: 'pointer', paddingRight: 8,
    maxWidth: 220,
  };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <style>{`
        @keyframes dashPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#3B0764' }}>
            📊 Home Dashboard
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(91,33,182,0.50)' }}>
            Button click analytics across all funnel pages
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.68rem', color: 'rgba(91,33,182,0.45)', whiteSpace: 'nowrap' }}>
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchDashboard}
            style={{
              height: '2rem', padding: '0 12px', borderRadius: 8, border: 'none',
              background: 'rgba(91,33,182,0.08)', color: '#5B21B6',
              fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        background: 'rgba(237,234,248,0.50)', borderRadius: 14, padding: '12px 14px',
        marginBottom: 24,
      }}>
        {/* Date range pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all',    label: 'All Time' },
            { id: 'today',  label: 'Today' },
            { id: 'week',   label: 'This Week' },
            { id: 'month',  label: 'This Month' },
            { id: 'custom', label: 'Custom' },
          ].map(p => (
            <Pill key={p.id} label={p.label} active={dateRange === p.id} onClick={() => setDateRange(p.id)} />
          ))}
        </div>

        {/* Custom date inputs */}
        {dateRange === 'custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(91,33,182,0.50)' }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inputStyle} />
          </div>
        )}

        {/* Webinar session filter */}
        {sessions.length > 0 && (
          <select
            value={webinarAt}
            onChange={e => setWebinarAt(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Webinars</option>
            {sessions.map(s => (
              <option key={s} value={s}>{fmtSession(s)}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(254,242,242,0.80)', border: '1px solid rgba(239,68,68,0.30)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          color: '#DC2626', fontSize: '0.82rem', fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* ── Stat grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 12, marginBottom: 28,
      }}>
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonBox key={i} />)
          : STAT_BOXES.map(box => <StatBox key={box.key} box={box} counts={counts} />)
        }
      </div>

      {/* ── Funnel drop-off table ── */}
      {!loading && (
        <div style={{
          borderRadius: 16, border: '1px solid rgba(147,51,234,0.12)',
          background: '#fff', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(91,33,182,0.07)',
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid rgba(147,51,234,0.08)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '1rem' }}>📉</span>
            <span style={{ fontWeight: 800, fontSize: '0.90rem', color: '#3B0764' }}>
              Funnel Drop-off
            </span>
          </div>

          <div style={{ padding: '8px 0' }}>
            {funnelData.map((step, i) => {
              const prev = i > 0 ? funnelData[i - 1].count : null;
              const dropPct = prev && prev > 0
                ? Math.round((1 - step.count / prev) * 100)
                : null;

              const barPct = funnelData[0].count > 0
                ? Math.min(100, Math.round((step.count / funnelData[0].count) * 100))
                : 0;

              return (
                <div key={step.label} style={{
                  padding: '10px 20px',
                  borderBottom: i < funnelData.length - 1 ? '1px solid rgba(147,51,234,0.06)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'rgba(91,33,182,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800, color: '#5B21B6',
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3B0764' }}>
                        {step.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {dropPct !== null && (
                        <span style={{
                          fontSize: '0.70rem', fontWeight: 700,
                          color: dropPct > 50 ? '#DC2626' : dropPct > 25 ? '#D97706' : '#059669',
                          background: dropPct > 50 ? 'rgba(220,38,38,0.08)' : dropPct > 25 ? 'rgba(217,119,6,0.08)' : 'rgba(5,150,105,0.08)',
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          −{dropPct}% drop
                        </span>
                      )}
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#5B21B6', minWidth: 40, textAlign: 'right' }}>
                        {step.count.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 4, background: 'rgba(91,33,182,0.08)' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: 'linear-gradient(90deg, #5B21B6, #9333EA)',
                      width: `${barPct}%`,
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
