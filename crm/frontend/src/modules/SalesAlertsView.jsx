import { useState, useEffect, useCallback } from 'react';
import Toast from '../components/Toast';

/* ──────────────────────────────────────────────────────────────────────
   Sales → Alerts tab.

   CRUD over telegram_alert_recipients. Two recipient kinds:
     • team_leader → a TL who receives alerts about callers reporting to
       them (junior + senior callers under a specific team_leader_id).
     • manager    → receives alerts about all callers in a department
       (NULL department = subscribes to everything).

   Each row exposes a TEST button that pings the recipient's Telegram
   chat so the admin can confirm the chat_id is correct before saving.
   ────────────────────────────────────────────────────────────────────── */

const FONT = 'Outfit, sans-serif';
const PURPLE_BG = 'rgba(139,92,246,0.18)';
const PURPLE_TX = '#3B0764';
const SHADOW = '0 2px 10px rgba(91,33,182,0.10)';

export default function SalesAlertsView({ token }) {
  const [recipients, setRecipients] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', kind: 'success' });

  // Unsaved-row buffer for new entries. Persisted-row edits are applied
  // immediately to the row's local state; SAVE walks any row with a
  // `_dirty` marker and PATCHes it.
  const [rows, setRows] = useState([]); // working copy = recipients + drafts

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, usersRes] = await Promise.all([
        fetch('/api/admin/telegram-alerts',  { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/crm-users',        { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!alertsRes.ok) throw new Error('Failed to load alert recipients.');
      const alertsData = await alertsRes.json();
      setRecipients(alertsData.recipients || []);
      setRows((alertsData.recipients || []).map(r => ({ ...r, _persisted: true })));

      if (usersRes.ok) {
        const u = await usersRes.json();
        setTeamLeaders((u.users || []).filter(x => x.role === 'team_leader'));
      }
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function addBlankRow() {
    setRows(prev => [
      ...prev,
      {
        _draft:           true,
        _localId:         `draft-${Date.now()}-${Math.random()}`,
        telegram_chat_id: '',
        target_type:      'team_leader',
        team_leader_id:   '',
        department:       '',
        label:            '',
      },
    ]);
  }

  function patchRow(idx, patch) {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: !r._draft } : r)));
  }

  async function removeRow(idx) {
    const row = rows[idx];
    if (row._draft) {
      setRows(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm('Remove this Telegram recipient?')) return;
    try {
      const res = await fetch(`/api/admin/telegram-alerts/${row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed.');
      setToast({ msg: 'Recipient removed.', kind: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.message, kind: 'error' });
    }
  }

  async function saveAll() {
    setSaving(true);
    setError('');
    try {
      for (const row of rows) {
        if (row._draft) {
          // Skip empty drafts so the user can click ADD then change their mind.
          if (!row.telegram_chat_id || !String(row.telegram_chat_id).trim()) continue;
          const body = {
            telegram_chat_id: row.telegram_chat_id,
            target_type:      row.target_type,
            team_leader_id:   row.target_type === 'team_leader' ? row.team_leader_id || null : null,
            department:       row.target_type === 'manager'     ? row.department || null     : null,
            label:            row.label || null,
          };
          if (row.target_type === 'team_leader' && !body.team_leader_id) {
            throw new Error('Pick a Team Leader for the row before saving.');
          }
          const res = await fetch('/api/admin/telegram-alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Create failed.');
          }
        } else if (row._dirty) {
          const body = {
            telegram_chat_id: row.telegram_chat_id,
            target_type:      row.target_type,
            team_leader_id:   row.target_type === 'team_leader' ? row.team_leader_id || null : null,
            department:       row.target_type === 'manager'     ? row.department || null     : null,
            label:            row.label || null,
          };
          const res = await fetch(`/api/admin/telegram-alerts/${row.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error('Update failed.');
        }
      }
      setToast({ msg: 'All recipients saved.', kind: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.message, kind: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(row, idx) {
    if (row._draft || row._dirty) {
      setToast({ msg: 'Save the row first, then test.', kind: 'info' });
      return;
    }
    setTestingId(row.id);
    try {
      const res = await fetch(`/api/admin/telegram-alerts/${row.id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Test send failed.');
      }
      setToast({ msg: 'Test message sent.', kind: 'success' });
    } catch (e) {
      setToast({ msg: e.message, kind: 'error' });
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="bg-white rounded-card" style={{ padding: 22, boxShadow: SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontFamily: FONT, fontWeight: 800, color: PURPLE_TX, letterSpacing: 1, fontSize: '1.05rem' }}>
          TELEGRAM ALERTS
        </h3>
        <span style={{ fontFamily: FONT, fontSize: '0.75rem', color: 'rgba(91,33,182,0.55)' }}>
          {rows.length} recipient{rows.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(254,242,242,0.95)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontFamily: FONT, fontSize: '0.82rem', color: '#DC2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', fontFamily: FONT, color: 'rgba(91,33,182,0.55)', fontSize: '0.85rem' }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.length === 0 && (
            <div style={{ padding: 16, fontFamily: FONT, color: 'rgba(91,33,182,0.55)', fontSize: '0.85rem' }}>
              No recipients yet. Click ADD to create one.
            </div>
          )}

          {rows.map((row, idx) => (
            <AlertRow
              key={row.id || row._localId}
              row={row}
              teamLeaders={teamLeaders}
              testing={testingId === row.id}
              onChange={(patch) => patchRow(idx, patch)}
              onTest={() => sendTest(row, idx)}
              onRemove={() => removeRow(idx)}
            />
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={addBlankRow} style={btn(PURPLE_BG, PURPLE_TX)}>
              ＋ ADD
            </button>
            <button onClick={saveAll} disabled={saving} style={btn('#5B21B6', '#fff', saving)}>
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </div>
      )}

      {toast.msg && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast({ msg: '', kind: 'success' })} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   A single recipient row. Matches the screenshot layout:
   [USER ID] [TL OR MANAGER select] [TEST] (and a small × to remove)
   ────────────────────────────────────────────────────────────────────── */
function AlertRow({ row, teamLeaders, testing, onChange, onTest, onRemove }) {
  const isManager = row.target_type === 'manager';

  // Compose a single dropdown value that encodes both target_type AND
  // either the TL id or the department, so the UI feels like ONE picker.
  const dropdownValue = isManager
    ? `manager:${row.department || ''}`
    : `tl:${row.team_leader_id || ''}`;

  function onDropdownChange(e) {
    const v = e.target.value;
    if (v.startsWith('manager:')) {
      onChange({ target_type: 'manager', team_leader_id: '', department: v.slice('manager:'.length) });
    } else if (v.startsWith('tl:')) {
      onChange({ target_type: 'team_leader', department: '', team_leader_id: v.slice('tl:'.length) });
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 12px', borderRadius: 14,
      background: row._dirty || row._draft ? 'rgba(254,243,199,0.5)' : 'rgba(237,234,248,0.55)',
      border: '1px solid rgba(139,92,246,0.18)',
    }}>
      <input
        value={row.telegram_chat_id || ''}
        onChange={(e) => onChange({ telegram_chat_id: e.target.value })}
        placeholder="USER ID"
        style={pill()}
      />

      <select value={dropdownValue} onChange={onDropdownChange} style={pill(220)}>
        <option value="tl:">— Pick TL or Manager —</option>
        <optgroup label="Team Leaders">
          {teamLeaders.map(tl => (
            <option key={tl.id} value={`tl:${tl.id}`}>
              {tl.full_name}{tl.department ? ` (${tl.department})` : ''}
            </option>
          ))}
        </optgroup>
        <optgroup label="Manager">
          <option value="manager:sales">Manager — Sales</option>
          <option value="manager:marketing">Manager — Marketing</option>
          <option value="manager:">Manager — All departments</option>
        </optgroup>
      </select>

      <input
        value={row.label || ''}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label (optional)"
        style={{ ...pill(180), background: '#fff' }}
      />

      <button
        onClick={onTest}
        disabled={testing || row._draft || row._dirty}
        style={btn('transparent', PURPLE_TX, testing || row._draft || row._dirty, true)}
        title={row._draft || row._dirty ? 'Save first, then test' : 'Send a test message'}
      >
        {testing ? '…SENDING' : 'TEST'}
      </button>

      <button
        onClick={onRemove}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: '#DC2626',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: '1.1rem',
          cursor: 'pointer',
          padding: '4px 10px',
        }}
        title="Remove recipient"
      >
        ×
      </button>
    </div>
  );
}

/* ── styling helpers ───────────────────────────────────────────────── */
function pill(width) {
  return {
    minWidth: width || 150,
    padding: '10px 16px',
    borderRadius: 50,
    border: '1px solid rgba(139,92,246,0.25)',
    background: PURPLE_BG,
    color: PURPLE_TX,
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: '0.82rem',
    outline: 'none',
  };
}
function btn(bg, color, disabled, outlined) {
  return {
    padding: '10px 22px',
    borderRadius: 50,
    border: outlined ? `1.5px solid ${PURPLE_TX}` : 'none',
    background: disabled ? 'rgba(91,33,182,0.25)' : bg,
    color,
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: '0.82rem',
    letterSpacing: 0.5,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 200ms',
  };
}
