import { useEffect, useState } from 'react';

function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

function fromLocalDatetimeValue(localVal) {
  if (!localVal) return null;
  const istMs = new Date(localVal + ':00').getTime();
  const utcMs = istMs - 5.5 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export default function TimerConfig({ token }) {
  const [nextWebinar, setNextWebinar] = useState('');
  const [backupWebinar, setBackupWebinar] = useState('');
  const [killSwitch, setKillSwitch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(d => {
        setNextWebinar(toLocalDatetimeValue(d.next_webinar_at));
        setBackupWebinar(toLocalDatetimeValue(d.backup_webinar_at));
        setKillSwitch(d.kill_switch || false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setToast(null);
    const body = { kill_switch: killSwitch };
    if (nextWebinar) body.next_webinar_at = fromLocalDatetimeValue(nextWebinar);
    if (backupWebinar) body.backup_webinar_at = fromLocalDatetimeValue(backupWebinar);

    const res = await fetch('/api/admin/webinar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setToast({ ok: res.ok, msg: res.ok ? 'Settings saved! Countdown timer updated.' : 'Failed to save settings.' });
    setTimeout(() => setToast(null), 3500);
  }

  const DateCard = ({ label, value, onChange, hint }) => (
    <div className="bg-white rounded-card border border-purple-100 p-5 hover:border-purple-300 transition-colors">
      <label className="block font-sans font-semibold text-purple-900 text-sm mb-1">{label}</label>
      <p className="font-sans text-xs text-purple-400 mb-3">{hint}</p>
      <input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-purple-100 rounded-xl px-3 py-2.5 font-sans text-sm text-gray-700 outline-none focus:border-purple focus:shadow-[0_0_0_3px_rgba(91,33,182,0.08)] transition-all bg-purple-50/30"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-sans text-xl font-bold text-purple-900">Webinar Timer & Controls</h3>
        <p className="font-sans text-sm text-purple-400 mt-1">
          All times in IST (India Standard Time). Changes update the countdown timer instantly for all visitors.
        </p>
      </div>

      {/* Date pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DateCard
          label="Next Webinar"
          hint="Countdown timer target date & time"
          value={nextWebinar}
          onChange={setNextWebinar}
        />
        <DateCard
          label="Backup Webinar"
          hint="Fallback date if next webinar is cancelled"
          value={backupWebinar}
          onChange={setBackupWebinar}
        />
      </div>

      {/* Kill switch */}
      <div className={`rounded-card border-2 p-5 transition-all duration-300 ${
        killSwitch
          ? 'border-red-300 bg-red-50'
          : 'border-purple-100 bg-white'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans font-semibold text-gray-900">Registration Kill Switch</p>
            <p className={`font-sans text-xs mt-1 ${killSwitch ? 'text-red-600 font-medium' : 'text-purple-400'}`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${killSwitch ? 'bg-red-500' : 'bg-green-500'}`} />
              {killSwitch ? 'ACTIVE — All new form submissions are blocked' : 'OFF — Registrations are open and accepting submissions'}
            </p>
          </div>
          <button
            onClick={() => setKillSwitch(k => !k)}
            className={`relative w-14 h-7 rounded-full flex-shrink-0 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              killSwitch ? 'bg-red-500 focus:ring-red-400' : 'bg-gray-200 focus:ring-purple-400'
            }`}
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
              killSwitch ? 'translate-x-7' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {killSwitch && (
          <div className="mt-3 bg-red-100 rounded-xl px-3 py-2">
            <p className="font-sans text-xs text-red-700 font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Warning: New leads cannot register while this is active. Turn off when ready to accept registrations.
            </p>
          </div>
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
