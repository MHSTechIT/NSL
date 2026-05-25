import { useState, useEffect } from 'react';
import AdminLogin           from './admin/AdminLogin';
import SalesDashboardModule from './modules/SalesDashboardModule';
import ManagerSettings      from './ManagerSettings';

/* ──────────────────────────────────────────────────────────────────────────
   TLShell — the dashboard a `team_leader` lands on after login.

   Structurally identical to ManagerShell (same Web Reminder surface, same
   sign-out + settings flow) but scoped one rung lower: the TL sees only
   data for the callers they directly lead (crm_users.team_leader_id =
   <this TL's user id>) instead of the entire department a Manager sees.

   The actual scoping happens server-side. SalesDashboardModule forwards
   `tlMode` + `lockedTeamLeaderId` into every /api/admin/* fetch URL;
   routes/admin.js detects the team_leader JWT and adds a parallel
   `WHERE team_leader_id = $1` to each query.

   Auth: gated on the CRM-user JWT (mhs_crm_token) + the stored user,
   whose role must be 'team_leader'. SalesDashboardModule calls
   /api/admin/* with that JWT — backend's adminAuth now accepts a
   team_leader JWT alongside the manager JWT.
   ────────────────────────────────────────────────────────────────────────── */

export default function TLShell() {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem('mhs_crm_user');
    if (raw) { try { return JSON.parse(raw); } catch { return null; } }
    return null;
  });
  const jwt = sessionStorage.getItem('mhs_crm_token') || '';
  const [view, setView] = useState('dashboard');   // 'dashboard' | 'settings'

  useEffect(() => {
    document.body.style.maxWidth   = 'none';
    document.body.style.margin     = '0';
    document.body.style.background = '#EDEAF8';
    return () => {
      document.body.style.maxWidth   = '';
      document.body.style.margin     = '';
      document.body.style.background = '';
    };
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('mhs_crm_user');
    sessionStorage.removeItem('mhs_crm_token');
    setUser(null);
  }

  // Only a logged-in team_leader may see this shell.
  if (!user || !jwt || user.role !== 'team_leader') return <AdminLogin />;

  return (
    <div style={{ minHeight: '100vh', background: '#EDEAF8', fontFamily: 'Outfit, sans-serif', padding: '24px clamp(16px, 4vw, 32px)' }}>
      {view === 'settings' ? (
        <ManagerSettings token={jwt} onBack={() => setView('dashboard')} />
      ) : (
        <SalesDashboardModule
          token={jwt}
          tlMode
          lockedDepartment={user.department || null}
          lockedTeamLeaderId={user.id}
          tlProfile={user}
          onSignOut={handleLogout}
          onOpenSettings={() => setView('settings')}
        />
      )}
    </div>
  );
}
