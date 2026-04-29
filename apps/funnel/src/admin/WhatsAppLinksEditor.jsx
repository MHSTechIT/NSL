import { useEffect, useState } from 'react';
import DateTimePicker from './DateTimePicker';

function toISTValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

function fromISTValue(localVal) {
  if (!localVal) return null;
  const [date, time] = localVal.split('T');
  const [y, mo, d]  = date.split('-').map(Number);
  const [h, m]      = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, m) - 5.5 * 60 * 60 * 1000).toISOString();
}

export default function WhatsAppLinksEditor({ token }) {
  const [currentLink,   setCurrentLink]   = useState('');
  const [pendingLink,   setPendingLink]   = useState('');
  const [swapAt,        setSwapAt]        = useState('');
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [copied,        setCopied]        = useState(false);

  function loadConfig() {
    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(d => {
        setCurrentLink(d.tuesday_whatsapp_link || '');
        setPendingLink(d.pending_whatsapp_link || '');
        // Only keep the scheduled time if it's still in the future
        const swapRaw = d.whatsapp_link_swap_at;
        const isFuture = swapRaw && new Date(swapRaw) > new Date();
        setSwapAt(isFuture ? toISTValue(swapRaw) : '');
      });
  }

  useEffect(() => { loadConfig(); }, []);

  function extractURL(val) {
    const match = val.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : val.trim();
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    const cleanLink = extractURL(pendingLink);
    setPendingLink(cleanLink);

    let body;
    if (swapAt) {
      // Scheduled swap — store as pending, activates at the set time
      body = {
        pending_whatsapp_link: cleanLink,
        whatsapp_link_swap_at: fromISTValue(swapAt),
      };
    } else {
      // No schedule → activate immediately
      body = {
        tuesday_whatsapp_link: cleanLink,
        friday_whatsapp_link: cleanLink,
        pending_whatsapp_link: '',
        whatsapp_link_swap_at: null,
      };
    }

    const res = await fetch('/api/admin/webinar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      // Always re-fetch from server so UI reflects exact DB state
      loadConfig();
    }

    setToast({
      ok: res.ok,
      msg: res.ok
        ? swapAt
          ? 'Scheduled! Link will auto-update at the set time.'
          : 'Link updated! It is now live for all users.'
        : 'Failed to save. Try again.',
    });
    setTimeout(() => setToast(null), 4000);
  }

  const hasSchedule = pendingLink && swapAt;
  const swapDate = swapAt ? new Date(fromISTValue(swapAt)) : null;

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 className="font-sans text-xl font-bold text-purple-900">WhatsApp Group Link</h3>
        <p className="font-sans text-sm text-purple-400 mt-1">
          Set the update link and the time — it will auto-activate on schedule.
        </p>
      </div>

      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1.5px solid rgba(37,211,102,0.35)',
        padding: '20px 20px 22px',
        boxShadow: '0 2px 16px rgba(37,211,102,0.08)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>

        {/* Currently Active indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.70rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Currently Active
          </span>
        </div>

        {/* Current live link — read-only */}
        <div style={{
          background: 'rgba(37,211,102,0.07)', borderRadius: 12,
          border: '1px solid rgba(37,211,102,0.25)', padding: '10px 14px',
        }}>
          <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.70rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 7 }}>
            Current Link
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="url"
              value={currentLink}
              readOnly
              style={{
                flex: 1, height: '2.4rem', padding: '0 10px',
                borderRadius: 10, border: '1px solid rgba(37,211,102,0.35)',
                background: 'rgba(240,255,244,0.80)',
                fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem',
                color: '#15803d', fontWeight: 500, outline: 'none', cursor: 'default',
              }}
            />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(currentLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              title="Copy link"
              style={{
                width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(37,211,102,0.35)',
                background: copied ? '#22c55e' : 'rgba(255,255,255,0.80)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 200ms',
              }}
            >
              {copied
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(139,92,246,0.10)' }} />

        {/* Update Link — pending */}
        <div>
          <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#4A1A94', display: 'block', marginBottom: 7 }}>
            Update Link
          </label>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <input
              type="url"
              value={pendingLink}
              onChange={e => setPendingLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              style={{
                width: '100%', height: '2.8rem',
                paddingLeft: 38, paddingRight: 12,
                borderRadius: 12,
                border: '1px solid rgba(139,92,246,0.22)',
                background: 'rgba(237,234,248,0.30)',
                fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem',
                color: '#3B0764', outline: 'none', boxSizing: 'border-box',
                transition: 'border 200ms',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(91,33,182,0.55)'}
              onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.22)'}
            />
          </div>
          {pendingLink && (
            <a href={pendingLink} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', color: '#5B21B6', textDecoration: 'underline' }}>
              Preview link ↗
            </a>
          )}
        </div>

        {/* Auto-swap date & time */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#4A1A94' }}>
              Auto-activate at (IST) <span style={{ fontWeight: 400, color: 'rgba(91,33,182,0.50)' }}>— optional</span>
            </label>
            {swapAt && (
              <button
                type="button"
                onClick={() => setSwapAt('')}
                title="Clear schedule — link will activate immediately on Save"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 20,
                  border: '1px solid rgba(220,38,38,0.35)',
                  background: 'rgba(254,226,226,0.60)',
                  fontFamily: 'Outfit, sans-serif', fontSize: '0.70rem', fontWeight: 700,
                  color: '#DC2626', cursor: 'pointer',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear schedule
              </button>
            )}
          </div>
          <DateTimePicker value={swapAt} onChange={setSwapAt} placeholder="Leave blank to update immediately" />
          {swapDate && (
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.73rem', color: 'rgba(91,33,182,0.55)', marginTop: 6 }}>
              {swapDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
            </p>
          )}
          {!swapAt && pendingLink && (
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.73rem', color: '#15803d', marginTop: 6, fontWeight: 600 }}>
              ✓ No schedule set — will go live immediately on Save
            </p>
          )}
        </div>

        {/* Scheduled status banner */}
        {hasSchedule && (
          <div style={{
            background: 'rgba(245,243,255,1)', borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.25)', padding: '10px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', color: '#5B21B6', lineHeight: 1.4 }}>
              New link will auto-activate on{' '}
              <strong>
                {swapDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: '2.7rem', padding: '0 28px', borderRadius: 50,
            border: 'none',
            background: saving ? 'rgba(91,33,182,0.55)' : '#5B21B6',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.92rem',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 12px rgba(91,33,182,0.25)',
            opacity: saving ? 0.7 : 1, transition: 'all 200ms',
          }}
        >
          {saving ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 15, height: 15 }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving...
            </>
          ) : 'Save'}
        </button>

        {toast && (
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: toast.ok ? '#15803d' : '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
            {toast.ok ? '✓' : '✕'} {toast.msg}
          </span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
