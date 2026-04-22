import { useEffect, useState } from 'react';

export default function WhatsAppLinksEditor({ token }) {
  const [tuesday, setTuesday] = useState('');
  const [friday, setFriday] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(d => {
        setTuesday(d.tuesday_whatsapp_link || '');
        setFriday(d.friday_whatsapp_link || '');
      });
  }, []);

  /* Extract just the URL if user pastes the full WhatsApp invite message */
  function extractURL(val) {
    const match = val.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : val.trim();
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    const cleanTuesday = extractURL(tuesday);
    const cleanFriday  = extractURL(friday);
    setTuesday(cleanTuesday);
    setFriday(cleanFriday);
    const res = await fetch('/api/admin/webinar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tuesday_whatsapp_link: cleanTuesday, friday_whatsapp_link: cleanFriday }),
    });
    setSaving(false);
    setToast({ ok: res.ok, msg: res.ok ? 'WhatsApp links saved successfully!' : 'Failed to save. Check the URLs.' });
    setTimeout(() => setToast(null), 3500);
  }

  const DayCard = ({ day, value, onChange }) => (
    <div className="bg-white rounded-card border border-purple-100 p-5 hover:border-purple-300 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div>
          <p className="font-sans font-semibold text-purple-900 text-sm">{day} Group Link</p>
          <p className="font-sans text-xs text-purple-400">Registrants on {day === 'Tuesday' ? 'Mon & Tue' : 'Wed–Sun'} get this link</p>
        </div>
      </div>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://chat.whatsapp.com/..."
        className="w-full border border-purple-100 rounded-xl px-3 py-2.5 font-sans text-sm text-gray-700 outline-none focus:border-purple focus:shadow-[0_0_0_3px_rgba(91,33,182,0.08)] transition-all bg-purple-50/30 placeholder:text-purple-200"
      />
      {value && (
        <a href={value} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 mt-2 font-sans text-xs text-purple-500 hover:text-purple underline">
          Preview link ↗
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-sans text-xl font-bold text-purple-900">WhatsApp Group Links</h3>
        <p className="font-sans text-sm text-purple-400 mt-1">
          Set the group invite links for Tuesday and Friday webinar sessions.
          The server automatically picks the right link based on the day a lead registers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DayCard day="Tuesday" value={tuesday} onChange={setTuesday} />
        <DayCard day="Friday" value={friday} onChange={setFriday} />
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-purple text-white font-sans font-semibold px-6 py-2.5 rounded-pill disabled:opacity-50 hover:bg-purple-700 transition-colors shadow-[0_2px_12px_rgba(91,33,182,0.25)]"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving...
            </>
          ) : 'Save Links'}
        </button>
        {toast && (
          <span className={`font-sans text-sm font-medium ${toast.ok ? 'text-brand-green' : 'text-red-500'}`}>
            {toast.ok
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }{toast.msg}
          </span>
        )}
      </div>
    </div>
  );
}
