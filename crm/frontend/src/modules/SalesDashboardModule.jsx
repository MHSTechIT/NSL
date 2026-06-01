import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SalesLeadsTable        from './SalesLeadsTable';
import SalesLeadsLogicView    from './SalesLeadsLogicView';
import SalesPerformanceView   from './SalesPerformanceView';
import SalesNotificationsView from './SalesNotificationsView';
import SalesTimerView         from './SalesTimerView';
import SalesAlertsView        from './SalesAlertsView';
import SalesCompletedCallsView from './SalesCompletedCallsView';
import SalesNewPageView       from './SalesNewPageView';
import UsersModule            from './UsersModule';

const TABS = [
  {
    id: 'performance',
    label: 'Performance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>
      </svg>
    ),
  },
  {
    // New page slotted right next to Performance. Functionality TBD — renders
    // SalesNewPageView (a placeholder) for now. Rename id/label when defined.
    id: 'newpage',
    label: 'New Page',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'logic',
    label: 'Leads Logic',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    // New tab — functionality to be wired in a follow-up. For now it
    // renders a placeholder card so the tab is reachable and the layout
    // is settled.
    id: 'completed_calls',
    label: 'Completed Calls',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
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
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

/* Manager-mode only — a "User" tab slotted next to Notifications. */
const USER_TAB = {
  id: 'user',
  label: 'User',
  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

/* Logo button + profile popover for the manager dashboard — clicking the
   logo reveals the manager's name, position, phone and email, plus Sign Out. */
function ManagerProfileMenu({ profile, onSignOut, onOpenSettings }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 16 });
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  function toggle() {
    setOpen(o => {
      const next = !o;
      if (next && btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
      }
      return next;
    });
  }

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onScroll() { setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const roleLabel = String(profile?.role || '')
    .split('_').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const iconStroke = { stroke: '#5B21B6', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Profile"
        aria-label="Profile"
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 0, transition: 'transform 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <img src="/favicon.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </button>

      {open && createPortal(
        <div onMouseDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: pos.top, right: pos.right,
          width: 264, background: '#fff', borderRadius: 14,
          border: '1px solid rgba(209,196,240,0.60)',
          boxShadow: '0 16px 48px rgba(91,33,182,0.22)',
          zIndex: 10000, overflow: 'hidden', fontFamily: 'Outfit, sans-serif',
        }}>
          <div style={{ padding: '16px 16px 14px' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#3B0764', wordBreak: 'break-word' }}>
              {profile?.full_name || '—'}
            </div>
            {roleLabel && (
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 50,
                background: 'rgba(91,33,182,0.10)', color: '#5B21B6',
                fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {roleLabel}
              </span>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.82rem', color: 'rgba(59,7,100,0.85)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" {...iconStroke} style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span style={{ wordBreak: 'break-word' }}>{profile?.phone || 'No phone'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.82rem', color: 'rgba(59,7,100,0.85)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" {...iconStroke} style={{ flexShrink: 0 }}>
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 6L2 7"/>
                </svg>
                <span style={{ wordBreak: 'break-word' }}>{profile?.email || '—'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); if (onOpenSettings) onOpenSettings(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', border: 'none', borderTop: '1px solid rgba(209,196,240,0.55)',
              background: '#fff', color: '#5B21B6',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,33,182,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>
          <button
            type="button"
            onClick={onSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', border: 'none', borderTop: '1px solid rgba(209,196,240,0.55)',
              background: 'rgba(254,242,242,0.70)', color: '#DC2626',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function SalesDashboardModule({
  token,
  managerMode      = false,   // manager dashboard → adds the User tab + profile menu
  lockedDepartment = null,
  lockedManagerId  = null,
  onSignOut        = null,
  onOpenSettings   = null,
  managerProfile   = null,
  // ── TL (Team Leader) mode ──────────────────────────────────────────
  // Same surface as the super-admin Web Reminder + Manager dashboard,
  // just scoped to a single TL's team. Backend routes detect the
  // team_leader JWT role and add a parallel WHERE team_leader_id = $1
  // to each query. Frontend passes the TL's id down so child views
  // and forms can lock their fields to the right team.
  tlMode             = false,
  lockedTeamLeaderId = null,
  tlProfile          = null,
}) {
  const [tab, setTab] = useState('performance');
  /* Manager mode slots the "User" tab in just before Notifications and drops
     "Timer" — Timer lives in the Settings page (reached via the profile menu).
     Order: Performance · Leads · Leads Logic · User · Notifications.

     TL mode: Performance · Leads · Leads Logic · User · Notifications ·
     Completed Calls. Timer and Alerts are intentionally hidden — TLs
     don't tune global timer config and don't manage Telegram recipients
     (those are manager+ responsibilities). */
  // Slot USER_TAB immediately before the Notifications tab, id-based so the
  // ordering survives tabs being inserted/removed elsewhere in TABS.
  const withUserBeforeNotifications = (list) => {
    const i = list.findIndex(t => t.id === 'notifications');
    return i === -1 ? [...list, USER_TAB] : [...list.slice(0, i), USER_TAB, ...list.slice(i)];
  };
  let tabs;
  if (tlMode) {
    // Drop the 'timer' and 'alerts' tabs from the TL view.
    const tlVisible = TABS.filter(t => t.id !== 'timer' && t.id !== 'alerts');
    tabs = withUserBeforeNotifications(tlVisible);
  } else if (managerMode) {
    // Manager subset: Performance (+ adjacent new page), Leads, Leads Logic,
    // User, Notifications. Timer/Alerts/Completed Calls are intentionally out.
    const mgrIds = ['performance', 'newpage', 'leads', 'logic', 'notifications'];
    tabs = withUserBeforeNotifications(TABS.filter(t => mgrIds.includes(t.id)));
  } else {
    tabs = TABS;
  }
  /* Convenience: which scoped-profile mode is active? Used for the profile
     menu + downstream prop forwarding. tlProfile takes precedence when
     both are accidentally true (defensive). */
  const profileForMenu = tlMode ? tlProfile : managerProfile;
  const showProfileMenu = (tlMode || managerMode) && onSignOut;
  /* Right-side slot that sits on the same row as the tab bar. The
     Performance view portals its Refresh + Export CSV buttons into this
     slot via the `actionsSlotRef` prop so the actions logically belong
     to that view but visually live up here next to the tabs. The slot is
     re-rendered with `slotEl` state so the child's first portal attempt
     reliably finds the DOM node. */
  const actionsSlotRef = useRef(null);
  const [slotEl, setSlotEl] = useState(null);
  useEffect(() => { setSlotEl(actionsSlotRef.current); }, []);

  /* Auto-pause notification count — polled here in the parent (not just in
     SalesNotificationsView) so the Notifications tab can show a live badge
     even while the user is on another tab. 30 s poll mirrors the view. */
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const loadCount = async () => {
      try {
        // The backend infers the team-leader scope from the JWT itself
        // (no extra query param needed) — same way managerMode works.
        const res = await fetch('/api/admin/auto-paused-callers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNotifCount((data.callers || []).length);
      } catch { /* ignore — badge just stays at its last value */ }
    };
    loadCount();
    const id = setInterval(loadCount, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        /* Always-on horizontal scrollbar hide so the tab pill stays
           inside its white card at every viewport. Overflow itself is
           always-on (set inline below). */
        .sales-tabs-bar::-webkit-scrollbar { width: 0; height: 0; display: none; }
        @media (max-width: 640px) {
          .sales-tab-btn  { padding: 8px 10px !important; font-size: 0.75rem !important; gap: 5px !important; }
        }
      `}</style>

      {/* Tab bar (left) + action slot (right) — one row.
          Sticky-top so it stays visible as the user scrolls the data below. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 30,
        background: '#EDEAF8', padding: '6px 0',
      }}>
        <div className="sales-tabs-bar" style={{
          display: 'flex', gap: 4, background: '#fff', borderRadius: 16, padding: 6,
          boxShadow: '0 2px 12px rgba(91,33,182,0.08)',
          minWidth: 0, flexShrink: 1,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="sales-tab-btn"
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
                {t.id === 'notifications' && notifCount > 0 && (
                  <span
                    style={{
                      minWidth: 18, height: 18, padding: '0 5px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 50, background: '#DC2626', color: '#fff',
                      fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                      fontSize: '0.66rem', lineHeight: 1, flexShrink: 0,
                      boxShadow: isActive ? '0 0 0 2px #5B21B6' : '0 0 0 2px #fff',
                    }}
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div
          ref={actionsSlotRef}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}
        />
        {showProfileMenu && (
          <ManagerProfileMenu profile={profileForMenu} onSignOut={onSignOut} onOpenSettings={onOpenSettings} />
        )}
      </div>

      {tab === 'performance'   && <SalesPerformanceView   token={token} actionsSlotEl={slotEl} />}
      {tab === 'newpage'       && <SalesNewPageView       token={token} />}
      {tab === 'leads'         && <SalesLeadsTable        token={token} />}
      {tab === 'logic'         && <SalesLeadsLogicView    token={token} />}
      {tab === 'notifications' && <SalesNotificationsView token={token} />}
      {tab === 'user'          && (
        <UsersModule
          token={token}
          lockedDepartment={lockedDepartment}
          lockedManagerId={lockedManagerId}
          tlMode={tlMode}
          lockedTeamLeaderId={lockedTeamLeaderId}
          actionsSlotEl={slotEl}
        />
      )}
      {tab === 'completed_calls' && <SalesCompletedCallsView token={token} />}
      {tab === 'timer'         && <SalesTimerView         token={token} readOnly={tlMode} />}
      {tab === 'alerts'        && <SalesAlertsView        token={token} />}
    </div>
  );
}
