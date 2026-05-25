import { useState } from 'react';
import SalesTimerView from './modules/SalesTimerView';

/* ──────────────────────────────────────────────────────────────────────────
   ManagerSettings — the Settings page reached from the manager profile menu.

   Two sub-pages:
     • Timer  — the timing controls (moved out of the main dashboard tab bar).
     • Alerts — placeholder; the logic is still to be defined.

   `onBack` returns to the manager dashboard.
   ────────────────────────────────────────────────────────────────────────── */

const SETTINGS_TABS = [
  {
    id: 'timer',
    label: 'Timer',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 14"/>
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export default function ManagerSettings({ token, onBack }) {
  const [tab, setTab] = useState('timer');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        /* Always-on scrollbar hide; overflow itself set inline. */
        .mset-tabs-bar::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>

      {/* Header — Back button + the Timer / Alerts tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 30,
        background: '#EDEAF8', padding: '6px 0',
      }}>
        <button
          type="button"
          onClick={onBack}
          title="Back"
          aria-label="Back"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, padding: 0, borderRadius: 50,
            border: '1px solid rgba(91,33,182,0.20)', background: '#fff', color: '#5B21B6',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 2px 12px rgba(91,33,182,0.08)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        <div className="mset-tabs-bar" style={{
          display: 'flex', gap: 4, background: '#fff', borderRadius: 16, padding: 6,
          boxShadow: '0 2px 12px rgba(91,33,182,0.08)',
          minWidth: 0, flexShrink: 1,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {SETTINGS_TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 12, border: 'none',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 200ms', whiteSpace: 'nowrap', flexShrink: 0,
                  background: isActive ? '#5B21B6' : 'transparent',
                  color:      isActive ? '#fff'    : 'rgba(91,33,182,0.55)',
                  boxShadow:  isActive ? '0 2px 10px rgba(91,33,182,0.30)' : 'none',
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'timer' && <SalesTimerView token={token} />}

      {tab === 'alerts' && (
        <div className="bg-white rounded-card shadow-card" style={{ padding: 48, textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(91,33,182,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#3B0764' }}>Alerts</h3>
          <p style={{ margin: '8px auto 0', fontSize: '0.86rem', color: 'rgba(91,33,182,0.55)', maxWidth: 380 }}>
            This page is reserved — tell me how alerts should work and I'll build it out.
          </p>
        </div>
      )}
    </div>
  );
}
