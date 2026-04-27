import { useEffect, useState } from 'react';
import DateTimePicker from './DateTimePicker';

export default function WhatsAppLinksEditor({ token }) {
  const [waLink,       setWaLink]       = useState('');
  const [datetime,     setDatetime]     = useState('');
  const [savedLink,    setSavedLink]    = useState('');   // read-only "currently live"
  const [savedDatetime,setSavedDatetime]= useState('');
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(d => {
        const link = d.tuesday_whatsapp_link || '';
        setWaLink(link);
        setSavedLink(link);
        if (d.next_webinar_at) {
          const dt = new Date(d.next_webinar_at);
          const pad = n => String(n).padStart(2, '0');
          const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
          setDatetime(local);
          setSavedDatetime(dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }));
        }
      });
  }, []);

  function extractURL(val) {
    const match = val.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : val.trim();
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    const cleanLink = extractURL(waLink);
    setWaLink(cleanLink);

    const body = { tuesday_whatsapp_link: cleanLink, friday_whatsapp_link: cleanLink };
    if (datetime) body.next_webinar_at = new Date(datetime).toISOString();

    const res = await fetch('/api/admin/webinar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSavedLink(cleanLink);
      if (datetime) {
        const dt = new Date(datetime);
        setSavedDatetime(dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }));
      }
    }
    setToast({ ok: res.ok, msg: res.ok ? 'Saved successfully!' : 'Failed to save. Try again.' });
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 className="font-sans text-xl font-bold text-purple-900">WhatsApp Group Link</h3>
        <p className="font-sans text-sm text-purple-400 mt-1">
          Set the WhatsApp group invite link and webinar date &amp; time. The Join button on the confirmation page will use this link.
        </p>
      </div>

      {/* Currently active — read only */}
      {savedLink && (
        <div style={{
          background: 'rgba(37,211,102,0.07)',
          border: '1px solid rgba(37,211,102,0.25)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Currently Active</span>
          </div>
          <a
            href={savedLink}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#15803d',
              fontWeight: 600, wordBreak: 'break-all',
              textDecoration: 'underline', textDecorationColor: 'rgba(22,163,74,0.40)',
            }}
          >
            {savedLink}
          </a>
          {savedDatetime && (
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', color: 'rgba(21,128,61,0.65)' }}>
              📅 {savedDatetime} IST
            </span>
          )}
        </div>
      )}

      {/* Single card */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid rgba(139,92,246,0.15)',
        padding: '24px 20px',
        boxShadow: '0 2px 12px rgba(91,33,182,0.07)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* WhatsApp Link */}
        <div>
          <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#4A1A94', display: 'block', marginBottom: 8 }}>
            WhatsApp Group Link
          </label>
          <div style={{ position: 'relative' }}>
            {/* WA icon inside input */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <input
              type="url"
              value={waLink}
              onChange={e => setWaLink(e.target.value)}
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
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', color: '#5B21B6', textDecoration: 'underline' }}>
              Preview link ↗
            </a>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(139,92,246,0.10)' }} />

        {/* Date & Time */}
        <div>
          <label style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#4A1A94', display: 'block', marginBottom: 8 }}>
            Webinar Date &amp; Time
          </label>
          <DateTimePicker value={datetime} onChange={setDatetime} />
          {datetime && (
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.73rem', color: 'rgba(91,33,182,0.50)', marginTop: 6 }}>
              {new Date(datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
            </p>
          )}
        </div>
      </div>

      {/* Save button */}
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
