import { useEffect, useState } from 'react';
import DateTimePicker from './DateTimePicker';

function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

function fromLocalDatetimeValue(localVal) {
  if (!localVal) return null;
  const [date, time] = localVal.split('T');
  const [y, mo, d]  = date.split('-').map(Number);
  const [h, m]      = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, m) - 5.5 * 60 * 60 * 1000).toISOString();
}

export default function TimerConfig({ token }) {
  const [nextWebinar, setNextWebinar] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(d => setNextWebinar(toLocalDatetimeValue(d.next_webinar_at)));
  }, []);

  async function handleSave() {
    setSaving(true);
    setToast(null);
    const body = {};
    if (nextWebinar) body.next_webinar_at = fromLocalDatetimeValue(nextWebinar);

    const res = await fetch('/api/admin/webinar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setToast({ ok: res.ok, msg: res.ok ? 'Settings saved! Countdown timer updated.' : 'Failed to save settings.' });
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="space-y-5" style={{ maxWidth: 520 }}>
      <div>
        <h3 className="font-sans text-xl font-bold text-purple-900">Webinar Timer</h3>
        <p className="font-sans text-sm text-purple-400 mt-1">
          All times in IST (India Standard Time). Changes update the countdown timer instantly for all visitors.
        </p>
      </div>

      {/* Single date picker */}
      <div className="bg-white rounded-card border border-purple-100 p-5 hover:border-purple-300 transition-colors">
        <label className="block font-sans font-semibold text-purple-900 text-sm mb-1">Next Webinar</label>
        <p className="font-sans text-xs text-purple-400 mb-3">Countdown timer target date &amp; time</p>
        <DateTimePicker value={nextWebinar} onChange={setNextWebinar} />
        {nextWebinar && (
          <p className="font-sans text-xs text-purple-400 mt-2">
            {new Date(fromLocalDatetimeValue(nextWebinar)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
          </p>
        )}
      </div>

      {/* Save */}
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
          ) : 'Save Settings'}
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
