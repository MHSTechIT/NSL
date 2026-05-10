import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '../admin/DateTimePicker';

/* ──────────────────────────────────────────────────────────────────────────
   Lead Call Note Modal — opens when caller clicks the pencil icon on a lead.
   Captures the post-call form, then either:
     • Complete Call → marks lead completed, moves to Completed Leads
     • Follow Up + Date/Time → moves to Completed Leads with a follow-up tag,
       reappears in Assigned at the scheduled time
   ────────────────────────────────────────────────────────────────────────── */

const RANGES = [
  { value: '250+',         label: '250+' },
  { value: '200-250',      label: '200–250' },
  { value: '100-200',      label: '100–200' },
  { value: 'no_diabetes',  label: 'No Diabetes' },
];

const AGE_BUCKETS = [
  { value: '0-18',     label: '0–18' },
  { value: '19-24',    label: '19–24' },
  { value: '25-34',    label: '25–34' },
  { value: '35-44',    label: '35–44' },
  { value: '45-54',    label: '45–54' },
  { value: 'above-54', label: 'Above 54' },
];

const RANGE_FOR  = [{ value: 'personal', label: 'Personal' }, { value: 'family', label: 'For Family' }];
const DIET       = [{ value: 'yes', label: 'Yes' }, { value: 'not_interested', label: 'Not Interested' }];
const MEDICINE   = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const YES_NO     = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

const HBA1C = [
  { value: 'gt_7_5',    label: 'HbA1c > 7.5' },
  { value: '6_5_to_7_5', label: 'HbA1c 6.5 – 7.5' },
  { value: '5_7_to_6_5', label: 'HbA1c 5.7 – 6.5' },
];

const WORKING_PROFESSIONAL = [
  'Business', 'Daily Wages', 'Unemployed', 'House Wife', 'Private',
  'IT', 'Retired', 'Student', 'Working Professional', 'Government', 'Not Working',
].map(label => ({ value: label.toLowerCase().replace(/\s+/g, '_'), label }));

// Raw location list — duplicates and case-variants stripped at module load.
// Add or remove entries here; the dropdown rebuilds on next reload.
const LOCATIONS_RAW = [
  'chennai','madurai','bangalore','theni','thiruvallur','salem','thirupur','coimbatore','trichy','vellore',
  'selam','villupuram','kerala','erode','kancheepuram','kanyakumari','viruthunagar','kadaloor','karur',
  'madhurai','namakkal','thirupathur','tanjore','thanjavur','thenkasi','vilupuram','puthukottai','sivagangai',
  'thiruvarur','thoothukudi','chengalpattu','dharmapuri','krishnagiri','pudhukottai','thiruchy',
  'thiruvannamalai','ariyalur','coyamuthur','kadalor','kallakurichi','karnataka','nagapatinam','nagapattinam',
  'ranipettai','thirunelveli','thiruppur','virudhunagar','dindigul','pondicherry','tirunelveli','dindukal',
  'kadalur','kalakurichi','kallakuruchi','kanniyakumari','kumbakonam','mailadurai','namakal','oosur',
  'pondicheery','thiruvanamalai','thuthukodi','thuthukudi','tiruppur','tiruvanamalai','aandhra','combathur',
  'comibatore','dhindukal','kalakuruchi','kerela','mayiladuthurai','neelagiri','nilagiri','perambalur',
  'pollachi','ramanadhapuram','ramnadu','sales','sivakasi','tenkasi','thanjaore','thirunalveli',
  'thirunelvelli','thiruvalur','thiruvanmalai','thiruvaru','thoothukodi','thuthukoodi','trirupur','cuddalore',
  'kirisnagriji','maiyiladurai','nilgiris','vellour','andamaan','andaman','andhra','andra pradhash',
  'chagalpattu','iyambakkam','kadallour','kadallur','kanchipuram','karaikal','karaikkal','karaikudi',
  'karanataka','karnaka','karnata','kirishanagiri','kirishnagiri','kirshnagiri','krishna giri','maharastra',
  'mayiladudurai','mudurai','muduri','munnar','myladudurai','myladurai','nagai','nagalapuram','nangarkovil',
  'nellur','osur','palani','pandichery','pera','permablur','pettaipettai','podicherry','pudhu',
  'pudukkottai','pudukottai','rajapalayam','ramanadu','ramanathanpuram','ranipet','ranipett','salam',
  'sithur','sivagagai','sivaganga','tanjavur','tanjjore','telungana','teni','thanjaur','thanvanamalai',
  'tharmapuri','thirchy','thirichy','thirippathur','thiruchandhur','thirunallvalli','thiruppathur','thirupu',
  'thiruthani','thiruvanandhapuram','thrichy','thricy','tirupattur','trichi','trivhy','ulunthurpettai',
  'vadachennai','vandhavasi','virudachalam','viruthachalam','vithunagar','pondicherry',
];
const LOCATIONS = Array.from(new Set(LOCATIONS_RAW.map(s => s.trim().toLowerCase())))
  .sort()
  .map(v => ({ value: v, label: v.replace(/\b\w/g, c => c.toUpperCase()) }));

/* Append the caller's "delay reasons" (one per timer expiry) to the note so
   they're preserved in the saved record. */
function buildNoteWithDelays(noteText, delayReasons) {
  const note = (noteText || '').trim();
  const delays = (delayReasons || []).filter(Boolean);
  if (delays.length === 0) return note || null;
  const block = `[Delay reasons]\n` + delays.map((r, i) => `  ${i + 1}. ${r}`).join('\n');
  return note ? `${note}\n\n${block}` : block;
}

export default function LeadCallNoteModal({ jwt, lead, onClose, onSaved }) {
  const [fullName, setFullName]                   = useState(lead.full_name || '');
  const [confirmedRange, setConfirmedRange]       = useState('');
  const [rangeFor, setRangeFor]                   = useState('personal');
  const [patientAge, setPatientAge]               = useState('');
  const [dietStatus, setDietStatus]               = useState('');
  const [takesMedicine, setTakesMedicine]         = useState('');
  const [note, setNote]                           = useState('');
  const [hba1c, setHba1c]                             = useState('');
  const [otherLanguages, setOtherLanguages]           = useState('');
  const [workingProfessional, setWorkingProfessional] = useState('');
  const [location, setLocation]                       = useState('');
  const [alreadyPaid, setAlreadyPaid]                 = useState('');
  const [webinarAttended, setWebinarAttended]         = useState('');
  const [availableForWebinar, setAvailableForWebinar] = useState('');
  const [nextBatchJoining, setNextBatchJoining]       = useState('');
  const [interested, setInterested]               = useState('');   // '' | 'yes' | 'no'
  const [wantsFollowUp, setWantsFollowUp]         = useState(false);
  const [followUpAtLocal, setFollowUpAtLocal]     = useState(''); // 'YYYY-MM-DDTHH:mm:ss' (local time, from DateTimePicker)
  const [error, setError]                         = useState('');
  const [saving, setSaving]                       = useState(false);
  const [recalling, setRecalling]                 = useState(false);
  const [recallToast, setRecallToast]             = useState('');

  /* ── Call lifecycle state machine ──────────────────────────────────────
     callPhase drives the yellow status card at the top of the modal:
       'idle'         — modal opened, no call started yet (Start Auto Call shown)
       'calling_1'    — first call dialed, ringing
       'rejected_1'   — first call ended without answer (about to retry)
       'calling_2'    — second call dialed, ringing
       'rejected_2'   — second call also failed → auto-DNP fires
       'in_progress'  — customer answered, still on the line
       'form_window'  — call ended after answer, 30 s to fill form
       'delay_reason' — 30 s expired, asking for delay reason; submit restarts timer
     The cycle repeats from 'delay_reason' → 'form_window' until the caller
     completes the form.                                                      */
  const [callPhase, setCallPhase] = useState('idle');
  const [wasAnsweredRef]   = useState(() => ({ current: false }));   // ref-style flag
  const [attempt, setAttempt]         = useState(1);                       // 1 or 2
  const [autoRedialing, setAutoRedialing] = useState(false);
  const [autoDnpFiring, setAutoDnpFiring] = useState(false);

  // Live mirrors of the above so the SSE callback (set up once at mount) always
  // reads the freshest values instead of stale closure snapshots. Without these
  // a 'missed' SSE event for call 1 wouldn't reliably trigger call 2.
  const attemptRef       = useRef(1);
  const autoRedialingRef = useRef(false);
  const autoDnpFiringRef = useRef(false);
  const callPhaseRef     = useRef('idle');
  const lastSeenCallIdRef = useRef(null);
  useEffect(() => { attemptRef.current = attempt; }, [attempt]);
  useEffect(() => { autoRedialingRef.current = autoRedialing; }, [autoRedialing]);
  useEffect(() => { autoDnpFiringRef.current = autoDnpFiring; }, [autoDnpFiring]);
  useEffect(() => { callPhaseRef.current = callPhase; }, [callPhase]);

  const [formTimerSecs, setFormTimerSecs] = useState(0);   // 30 → 0 (form-fill window)
  const [delayCardOpen, setDelayCardOpen] = useState(false);
  const [delayReason, setDelayReason]     = useState('');
  const [delayReasons, setDelayReasons]   = useState([]); // accumulated, appended on submit
  const FORM_WINDOW_SECS = 30;

  /* If the modal was opened mid-call (auto-dial flow from parent), reflect that
     in the yellow card — the SSE handler will then move us through the phases. */
  useEffect(() => {
    if (lead?.last_call_id && callPhase === 'idle') setCallPhase('calling_1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.last_call_id]);

  /* Drive the phase machine from a single call object — used by SSE pushes
     and the polling fallback. Reads ref values so it always sees the latest
     attempt + guard flags regardless of when the closure was created. */
  function dispatchCallUpdate(call) {
    if (!call || call.lead_id !== lead.id) return;
    const st = call.status;
    // De-dupe identical pushes (SSE + poll both fire)
    const sig = `${call.id}:${st}`;
    if (lastSeenCallIdRef.current === sig) return;
    lastSeenCallIdRef.current = sig;

    if (st === 'answered') {
      wasAnsweredRef.current = true;
      setCallPhase('in_progress');
      return;
    }
    if (['initiated','ringing'].includes(st)) {
      wasAnsweredRef.current = false;
      setCallPhase(attemptRef.current === 2 ? 'calling_2' : 'calling_1');
      return;
    }
    if (['ended','missed','failed'].includes(st)) {
      if (wasAnsweredRef.current || call.answered_at) {
        wasAnsweredRef.current = true;
        if (callPhaseRef.current !== 'form_window' && callPhaseRef.current !== 'delay_reason') {
          setCallPhase('form_window');
          setFormTimerSecs(prev => (prev > 0 ? prev : FORM_WINDOW_SECS));
        }
      } else {
        setCallPhase(attemptRef.current < 2 ? 'rejected_1' : 'rejected_2');
        handleNoAnswer();
      }
    }
  }

  // Listen for call lifecycle on the open modal
  useEffect(() => {
    if (!jwt || !lead?.id) return;
    const url = `/api/caller/leads/events?token=${encodeURIComponent(jwt)}`;
    const es  = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === 'call.update') dispatchCallUpdate(msg.call);
      } catch (_) {}
    };
    es.onerror = () => { /* auto-reconnect */ };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, lead?.id]);

  /* Polling fallback — SSE can drop messages or land before the EventSource
     finishes connecting. While we're actively in a calling/in_progress phase,
     re-check the latest call row every 4 s so we never get stranded. */
  useEffect(() => {
    if (!jwt || !lead?.id) return;
    const ACTIVE = new Set(['calling_1', 'calling_2', 'in_progress', 'rejected_1']);
    if (!ACTIVE.has(callPhase)) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/caller/calls?lead_id=${encodeURIComponent(lead.id)}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.calls?.[0];
        if (cancelled || !latest) return;
        dispatchCallUpdate({ ...latest, lead_id: lead.id });
      } catch (_) { /* network blip — try again next tick */ }
    };
    const id = setInterval(tick, 4000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, lead?.id, callPhase]);

  // Tick the 30 s form-fill timer; open the "reason for delay" card when it hits 0
  useEffect(() => {
    if (formTimerSecs <= 0) return;
    const id = setInterval(() => {
      setFormTimerSecs(s => {
        if (s <= 1) {
          clearInterval(id);
          setDelayCardOpen(true);
          setCallPhase('delay_reason');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [formTimerSecs > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNoAnswer() {
    // Read live state from refs — stale closure values would block legitimate retries.
    if (autoDnpFiringRef.current || autoRedialingRef.current) return;
    if (attemptRef.current < 2) {
      // Immediate retry
      autoRedialingRef.current = true;
      setAutoRedialing(true);
      attemptRef.current = attemptRef.current + 1;
      setAttempt(attemptRef.current);
      // Allow the next terminal status to be processed even if it carries the
      // same call.id signature in some edge case
      lastSeenCallIdRef.current = null;
      setCallPhase('calling_2');
      try {
        await fetch('/api/caller/calls/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({ lead_id: lead.id }),
        });
      } catch (_) {}
      autoRedialingRef.current = false;
      setAutoRedialing(false);
    } else {
      // 2 attempts failed → auto-DNP and tell parent to advance
      autoDnpFiringRef.current = true;
      setAutoDnpFiring(true);
      try {
        await fetch(`/api/caller/leads/${lead.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({
            full_name: (fullName || lead.full_name || '').trim() || null,
            outcome:   'not_picked',
            note:      'Auto-marked: customer did not pick after 2 attempts.',
          }),
        });
      } catch (_) {}
      onSaved?.('not_picked', { autoAdvance: true });
    }
  }

  function handleDelayReasonSubmit() {
    const reason = delayReason.trim();
    if (!reason) return;
    setDelayReasons(prev => [...prev, reason]);
    setDelayCardOpen(false);
    setDelayReason('');
    setFormTimerSecs(FORM_WINDOW_SECS);
    setCallPhase('form_window');
  }

  /* Start Auto Call — caller hits the button on the yellow status card.
     Same backend endpoint as Recall but updates the phase machine. */
  async function startAutoCall() {
    if (recalling) return;
    wasAnsweredRef.current = false;
    attemptRef.current = 1;
    autoRedialingRef.current = false;
    autoDnpFiringRef.current = false;
    lastSeenCallIdRef.current = null;
    setAttempt(1);
    setAutoRedialing(false);
    setAutoDnpFiring(false);
    setFormTimerSecs(0);
    setDelayCardOpen(false);
    setDelayReason('');
    setRecalling(true);
    setRecallToast('');
    setCallPhase('calling_1');
    try {
      const res = await fetch('/api/caller/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to start call');
      // SSE will drive the rest of the phase transitions
    } catch (e) {
      setCallPhase('idle');
      setRecallToast(e.message || 'Call failed — Smartflo extension off?');
      setTimeout(() => setRecallToast(''), 3500);
    } finally {
      setRecalling(false);
    }
  }

  async function handleRecall() {
    if (recalling) return;
    // Manual recall = caller is trying again deliberately; cancel any pending
    // auto-flow and reset the state machine so the new call's events drive UI.
    wasAnsweredRef.current = false;
    attemptRef.current = 1;
    autoRedialingRef.current = false;
    autoDnpFiringRef.current = false;
    lastSeenCallIdRef.current = null;
    setAttempt(1);
    setAutoRedialing(false);
    setAutoDnpFiring(false);
    setFormTimerSecs(0);
    setDelayCardOpen(false);
    setDelayReason('');
    setRecalling(true);
    setRecallToast('');
    setCallPhase('calling_1');
    try {
      const res = await fetch('/api/caller/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to start call');
      setRecallToast('Calling…');
      setTimeout(() => setRecallToast(''), 2500);
    } catch (e) {
      setRecallToast(e.message || 'Recall failed');
      setTimeout(() => setRecallToast(''), 3500);
    } finally {
      setRecalling(false);
    }
  }

  /* Derived submission outcome:
     follow-up wins if checked; otherwise interested choice maps to completed/not_interested. */
  const derivedOutcome = wantsFollowUp
    ? 'follow_up'
    : interested === 'yes'
      ? 'completed'
      : interested === 'no'
        ? 'not_interested'
        : '';

  /* Validation mode is determined by selections:
       1. Interested = NO        → nothing is mandatory (caller may submit minimal info)
       2. Follow Up   = ON       → Note + Date + Time mandatory; others optional
       3. Default                → Confirm Range, "value for", Age, Diet, Medicine mandatory; Note optional
     Submit always requires at least one of Interested or Follow Up to be selected. */
  const noOverride        = interested === 'no';
  const followUpOnly      = !noOverride && wantsFollowUp;
  const detailsMandatory  = !noOverride && !wantsFollowUp;   // default mode

  function validate() {
    if (!fullName.trim()) return 'Name cannot be empty.';
    // Interested choice is ALWAYS required — no other selection can override this.
    if (interested !== 'yes' && interested !== 'no') {
      return 'Pick Interested — Yes or No.';
    }

    if (noOverride) {
      // NO mode: only Name (already validated above) and Note are mandatory
      if (!note.trim())  return 'Add a brief note about the not-interested reason.';
      return null;
    }

    if (followUpOnly) {
      if (!note.trim())                   return 'Please add a note about the follow-up.';
      if (!followUpAtLocal)               return 'Pick a follow-up date and time.';
      return null;
    }
    // detailsMandatory — full default form
    if (!confirmedRange) return 'Pick the patient’s confirmed sugar range.';
    if (!rangeFor)       return 'Pick whether the value is for personal or family use.';
    if (!patientAge)     return 'Pick the patient age range.';
    if (!dietStatus)     return 'Select diet preference.';
    if (!takesMedicine)  return 'Pick whether the patient takes medicine.';
    return null;
  }

  async function submitDnp() {
    if (!confirm('Are you sure to move this lead to not picked calls?')) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/caller/leads/${lead.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          outcome:   'not_picked',
          call_id:   lead.last_call_id || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      // Hang up whatever call is currently active for this lead (handles the
      // Recall case where lead.last_call_id is the old, already-ended call).
      fetch(`/api/caller/leads/${lead.id}/hangup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` },
      }).catch(() => {});
      onSaved?.('not_picked', { autoAdvance: true });
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    const v = validate();
    if (v) { setError(v); return; }

    let followUpAt = null;
    if (wantsFollowUp && followUpAtLocal) {
      // DateTimePicker emits a local datetime string ('YYYY-MM-DDTHH:mm:ss').
      // Parse it as local time → ISO UTC for storage.
      const [date, time] = followUpAtLocal.split('T');
      const [y, m, d] = date.split('-').map(Number);
      const [hh, mm, ss = 0] = (time || '').split(':').map(Number);
      const local = new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
      followUpAt = local.toISOString();
    }

    setSaving(true);
    setError('');
    try {
      // Derive sugar_confirmation from the comparison so legacy display logic still works
      const sugarConfirmation = confirmedRange === lead.sugar_level ? 'same' : 'different';
      const res = await fetch(`/api/caller/leads/${lead.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          full_name:             fullName.trim(),
          sugar_confirmation:    sugarConfirmation,
          confirmed_range:       confirmedRange || null,
          range_for:             rangeFor,
          patient_age:           patientAge,
          diet_status:           dietStatus,
          takes_medicine:        takesMedicine || null,
          hba1c:                 hba1c || null,
          other_languages:       otherLanguages || null,
          working_professional:  workingProfessional || null,
          location:              location || null,
          already_paid:          alreadyPaid || null,
          webinar_attended:      webinarAttended || null,
          available_for_webinar: availableForWebinar || null,
          next_batch_joining:    nextBatchJoining || null,
          note:                  buildNoteWithDelays(note, delayReasons),
          outcome:               derivedOutcome,
          follow_up_at:          followUpAt,
          call_id:               lead.last_call_id || null,
          interested:            interested || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save.');

      // Best-effort hang up whatever call is currently active for this lead.
      // Targeting the lead (not a stale call_id) means a Recall-then-Complete
      // sequence still terminates the new call, not the old one.
      fetch(`/api/caller/leads/${lead.id}/hangup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` },
      }).catch(() => { /* ignore — user already moved on */ });

      onSaved?.(derivedOutcome, { autoAdvance: true });
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(15,0,40,0.45)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
        animation: 'fadeIn 200ms ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .lcn-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 18px; row-gap: 0; }
        .lcn-form-grid > .lcn-wide { grid-column: 1 / -1; }
        @media (max-width: 720px) {
          .lcn-form-grid { grid-template-columns: 1fr; }
        }
        /* Hide scrollbar chrome but keep scroll functionality */
        .lcn-modal { scrollbar-width: none; -ms-overflow-style: none; }
        .lcn-modal::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>

      <div className="lcn-modal" style={{
        width: '100%', maxWidth: 920, maxHeight: '92vh',
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 22,
        border: '1px solid rgba(147,51,234,0.18)',
        boxShadow: '0 24px 64px rgba(91,33,182,0.30)',
        padding: '24px 22px 18px',
        fontFamily: 'Outfit, sans-serif',
        animation: 'scaleIn 200ms ease',
        // Whole modal scrolls as one unit — header + form + Complete Call button
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3B0764', margin: 0 }}>Fill up call details</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleRecall} disabled={recalling} aria-label="Recall lead"
              title={recalling ? 'Calling…' : 'Call this lead again'}
              style={{
                height: 30, padding: '0 12px', borderRadius: 8, border: 'none',
                background: recalling ? 'rgba(22,163,74,0.50)' : 'linear-gradient(135deg,#16A34A,#15803D)',
                color: '#fff', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '0.78rem',
                cursor: recalling ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                boxShadow: recalling ? 'none' : '0 2px 8px rgba(22,163,74,0.35)',
                whiteSpace: 'nowrap',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {recalling ? 'Calling…' : 'Recall'}
            </button>
            <button onClick={onClose} aria-label="Close"
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(91,33,182,0.08)', color: '#5B21B6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        {recallToast && (
          <div style={{
            margin: '-6px 0 12px', padding: '8px 12px', borderRadius: 8,
            background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.30)',
            color: '#15803D', fontSize: '0.80rem', fontWeight: 600,
          }}>{recallToast}</div>
        )}

        <CallStatusCard
          phase={callPhase}
          attempt={attempt}
          formTimerSecs={formTimerSecs}
          starting={recalling}
          onStart={startAutoCall}
          delayReason={delayReason}
          onDelayReasonChange={setDelayReason}
          onDelayReasonSubmit={handleDelayReasonSubmit}
          totalWindow={FORM_WINDOW_SECS}
        />

        <div className="lcn-form-grid">
          {/* Lead name — pre-filled, editable */}
          <FieldRow label="1. Name" mandatory wide>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Patient name"
              style={inputStyle}
              maxLength={120}
            />
          </FieldRow>

          {/* Mandatory confirmed range — registered value shown inline as a hint */}
          <FieldRow
            label={
              <>
                2. Confirm Range{' '}
                <span style={{ fontWeight: 500, color: 'rgba(91,33,182,0.65)', fontStyle: 'italic' }}>
                  (registered as <span style={{ fontWeight: 700, color: '#3B0764' }}>{lead.sugar_level || '—'}</span>)
                </span>
              </>
            }
            mandatory={detailsMandatory}
          >
            <RadioRow options={RANGES} value={confirmedRange} onChange={setConfirmedRange} wrap />
          </FieldRow>

          {/* Range purpose */}
          <FieldRow label="3. This value is for" mandatory={detailsMandatory}>
            <RadioRow options={RANGE_FOR} value={rangeFor} onChange={setRangeFor} />
          </FieldRow>

          {/* Patient age */}
          <FieldRow label="4. Patient Age" mandatory={detailsMandatory}>
            <RadioRow options={AGE_BUCKETS} value={patientAge} onChange={setPatientAge} wrap />
          </FieldRow>

          {/* Diet */}
          <FieldRow label="5. Diet" mandatory={detailsMandatory}>
            <RadioRow options={DIET} value={dietStatus} onChange={setDietStatus} />
          </FieldRow>

          {/* Medicine */}
          <FieldRow label="6. Medicine" mandatory={detailsMandatory} hint={detailsMandatory ? null : '(optional)'}>
            <RadioRow options={MEDICINE} value={takesMedicine} onChange={setTakesMedicine} />
          </FieldRow>

          {/* HbA1c */}
          <FieldRow label="7. HbA1c" hint="(optional)">
            <RadioRow options={HBA1C} value={hba1c} onChange={setHba1c} wrap />
          </FieldRow>

          {/* Other languages */}
          <FieldRow label="8. Other Languages" hint="(optional)">
            <RadioRow options={YES_NO} value={otherLanguages} onChange={setOtherLanguages} />
          </FieldRow>

          {/* Working professional */}
          <FieldRow label="9. Working Professional" hint="(optional)">
            <SelectField
              value={workingProfessional}
              onChange={setWorkingProfessional}
              options={WORKING_PROFESSIONAL}
              placeholder="Select occupation…"
            />
          </FieldRow>

          {/* Location */}
          <FieldRow label="10. Location" hint="(optional)">
            <SelectField
              value={location}
              onChange={setLocation}
              options={LOCATIONS}
              placeholder="Select location…"
            />
          </FieldRow>

          {/* Already paid */}
          <FieldRow label="11. Already Paid" hint="(optional)">
            <RadioRow options={YES_NO} value={alreadyPaid} onChange={setAlreadyPaid} />
          </FieldRow>

          {/* Webinar attended */}
          <FieldRow label="12. Webinar Attended" hint="(optional)">
            <RadioRow options={YES_NO} value={webinarAttended} onChange={setWebinarAttended} />
          </FieldRow>

          {/* Available for webinar */}
          <FieldRow label="13. Available for Webinar" hint="(optional)">
            <RadioRow options={YES_NO} value={availableForWebinar} onChange={setAvailableForWebinar} />
          </FieldRow>

          {/* Next batch joining */}
          <FieldRow label="14. Next Batch Joining" hint="(optional)">
            <RadioRow options={YES_NO} value={nextBatchJoining} onChange={setNextBatchJoining} />
          </FieldRow>

          {/* Note */}
          <FieldRow label="15. Note" mandatory={followUpOnly || noOverride} hint={(followUpOnly || noOverride) ? null : '(optional)'} wide>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Anything noteworthy from the conversation…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 10, border: '1px solid rgba(209,196,240,0.7)',
                background: 'rgba(237,234,248,0.30)',
                fontFamily: 'Outfit,sans-serif', fontSize: '0.86rem', color: '#3B0764',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </FieldRow>

          {/* Follow-up schedule — appears only after the caller toggles "Follow Up" on */}
          {wantsFollowUp && (
            <FieldRow label="16. Follow-up schedule" mandatory wide>
              <DateTimePicker
                value={followUpAtLocal}
                onChange={setFollowUpAtLocal}
                placeholder="Pick the callback date & time"
              />
            </FieldRow>
          )}

          {error && (
            <div className="lcn-wide" style={{ background: 'rgba(254,242,242,0.95)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: '8px 12px', marginTop: 6 }}>
              <p style={{ fontSize: '0.80rem', color: '#DC2626', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          {/* Two independent dimensions:
                - INTERESTED — yes / no / unset (one-of)
                - FOLLOW UP  — toggle (can combine with either YES or NO)        */}
          <div className="lcn-wide" style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Interested YES / NO segmented toggle */}
            <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.74rem',
                color: '#3B0764', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Interested <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>
              </span>
              <div style={{
                display: 'flex',
                background: 'rgba(237,234,248,0.50)',
                border: '1px solid rgba(209,196,240,0.7)',
                borderRadius: 14, padding: 4, gap: 4,
              }}>
                <button
                  type="button"
                  onClick={() => setInterested(interested === 'yes' ? '' : 'yes')}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                    background: interested === 'yes' ? '#10B981' : 'transparent',
                    color: interested === 'yes' ? '#fff' : 'rgba(91,33,182,0.65)',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: interested === 'yes' ? '0 4px 12px rgba(16,185,129,0.30)' : 'none',
                    transition: 'all 150ms',
                  }}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const turningOn = interested !== 'no';
                    setInterested(turningOn ? 'no' : '');
                    // NO and Follow Up are mutually exclusive
                    if (turningOn) setWantsFollowUp(false);
                  }}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                    background: interested === 'no' ? '#DC2626' : 'transparent',
                    color: interested === 'no' ? '#fff' : 'rgba(91,33,182,0.65)',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: interested === 'no' ? '0 4px 12px rgba(220,38,38,0.30)' : 'none',
                    transition: 'all 150ms',
                  }}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Follow Up — independent toggle; auto-sets Interested = YES when turned on */}
            <button
              type="button"
              onClick={() => {
                setWantsFollowUp(v => {
                  const next = !v;
                  if (next) {
                    // Turning Follow Up on → default Interested to YES if it isn't already
                    // (NO is mutually exclusive with Follow Up, so override that case too)
                    if (interested !== 'yes') setInterested('yes');
                  }
                  return next;
                });
              }}
              style={{
                flex: '1 1 200px',
                alignSelf: 'flex-end',
                height: '2.85rem',
                padding: '0 18px', borderRadius: 14, border: 'none',
                background: wantsFollowUp ? '#F59E0B' : 'rgba(245,158,11,0.10)',
                color: wantsFollowUp ? '#fff' : '#B45309',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: wantsFollowUp ? '0 4px 16px rgba(245,158,11,0.35)' : 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 150ms',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Follow Up
            </button>
          </div>

        </div>

        {/* Submit */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(209,196,240,0.40)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={submitDnp}
            disabled={saving}
            title="Lead didn't pick up — move to Not Picked"
            style={{ width: '100%', height: '2.5rem', borderRadius: 50,
                     border: '1.5px solid #B45309',
                     background: saving ? 'rgba(245,158,11,0.20)' : 'rgba(245,158,11,0.10)',
                     color: '#B45309', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '0.86rem',
                     cursor: saving ? 'not-allowed' : 'pointer',
                     letterSpacing: '0.04em' }}
          >
            DNP — Did Not Pick
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !(interested === 'yes' || interested === 'no')}
            style={{ width: '100%', height: '2.8rem', borderRadius: 50, border: 'none',
                     background: saving ? 'rgba(5,150,105,0.55)' : '#059669',
                     color: '#fff', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '0.92rem',
                     cursor: saving ? 'not-allowed' : 'pointer',
                     boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
                     opacity: (interested === 'yes' || interested === 'no') ? 1 : 0.6 }}
          >
            {saving ? 'Saving…' : 'Complete Call'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Subcomponents ── */

function FieldRow({ label, mandatory, hint, wide, children }) {
  return (
    <div className={wide ? 'lcn-wide' : undefined} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={fieldLabelStyle}>{label}</span>
        {mandatory && <span style={{ color: '#DC2626', fontSize: '0.70rem' }}>*</span>}
        {hint && <span style={{ color: 'rgba(91,33,182,0.45)', fontSize: '0.70rem', fontWeight: 500 }}>{hint}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function RadioRow({ options, value, onChange, wrap }) {
  return (
    <div style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 6 }}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '7px 14px', borderRadius: 10,
              border: selected ? 'none' : '1px solid rgba(91,33,182,0.20)',
              background: selected ? '#5B21B6' : '#fff',
              color: selected ? '#fff' : 'rgba(91,33,182,0.75)',
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.78rem',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: selected ? '0 2px 8px rgba(91,33,182,0.25)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* Yellow status card — Tata Tele call lifecycle.
   Drives caller through Start → Call 1/2 → optional retry → form-fill window. */
function CallStatusCard({
  phase, attempt, formTimerSecs, starting, onStart,
  delayReason, onDelayReasonChange, onDelayReasonSubmit, totalWindow,
}) {
  const cardBase = {
    marginBottom: 16,
    padding: '14px 18px',
    borderRadius: 12,
    border: '1.5px dashed #F59E0B',
    background: 'rgba(254,243,199,0.55)',
    color: '#92400E',
    fontFamily: 'Outfit, sans-serif',
    fontSize: '0.86rem',
    fontWeight: 600,
  };
  const dot = (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
      animation: 'fadeIn 1s ease-in-out infinite alternate', flexShrink: 0,
    }} />
  );
  const Row = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
  );

  if (phase === 'idle') {
    return (
      <div style={cardBase}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>Ready to start auto call. Make sure the Smartflo extension is online.</span>
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            style={{
              padding: '8px 18px', borderRadius: 50, border: 'none',
              background: starting ? 'rgba(245,158,11,0.55)' : '#F59E0B',
              color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.84rem',
              cursor: starting ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              boxShadow: starting ? 'none' : '0 4px 12px rgba(245,158,11,0.35)',
            }}
          >
            {starting ? 'Calling…' : '▶ Start Auto Call'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'calling_1') {
    return <div style={cardBase}><Row>{dot}<span>First call triggered — ringing the customer…</span></Row></div>;
  }
  if (phase === 'rejected_1') {
    return <div style={cardBase}><Row>{dot}<span>Customer rejected the call. Making a second try…</span></Row></div>;
  }
  if (phase === 'calling_2') {
    return <div style={cardBase}><Row>{dot}<span>Second call triggered — ringing the customer…</span></Row></div>;
  }
  if (phase === 'rejected_2') {
    return <div style={cardBase}><Row>{dot}<span>Customer didn't pick after 2 attempts — moving to Not Picked.</span></Row></div>;
  }
  if (phase === 'in_progress') {
    return <div style={cardBase}><Row>{dot}<span>Customer on the line — speak with them, then hang up to fill the form.</span></Row></div>;
  }
  if (phase === 'form_window') {
    const urgent = formTimerSecs <= 10;
    return (
      <div style={{
        ...cardBase,
        border: urgent ? '1.5px dashed #DC2626' : cardBase.border,
        background: urgent ? 'rgba(254,226,226,0.55)' : cardBase.background,
        color: urgent ? '#991B1B' : cardBase.color,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Row>{dot}<span>Call ended — please fill the form within {totalWindow} s.</span></Row>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            00:{String(formTimerSecs).padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  }
  if (phase === 'delay_reason') {
    return (
      <div style={{ ...cardBase, border: '1.5px dashed #DC2626', background: 'rgba(254,226,226,0.55)', color: '#991B1B', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
          Time's up — what's holding you up?
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(153,27,27,0.85)', fontWeight: 600 }}>
          Type the reason; submitting restarts the {totalWindow}-second timer.
        </div>
        <input
          type="text"
          value={delayReason}
          onChange={e => onDelayReasonChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onDelayReasonSubmit(); }}
          placeholder="e.g. Looking up patient history, asking supervisor…"
          autoFocus
          style={{
            height: '2.4rem', padding: '0 12px', borderRadius: 8,
            border: '1px solid rgba(220,38,38,0.30)', background: '#fff',
            fontFamily: 'Outfit, sans-serif', fontSize: '0.86rem', color: '#3B0764',
          }}
        />
        <button
          type="button"
          onClick={onDelayReasonSubmit}
          disabled={!delayReason.trim()}
          style={{
            alignSelf: 'flex-end',
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: delayReason.trim() ? '#B91C1C' : 'rgba(220,38,38,0.30)',
            color: '#fff', fontWeight: 700, fontSize: '0.84rem',
            cursor: delayReason.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Go to form → restart {totalWindow}s timer
        </button>
      </div>
    );
  }
  return null;
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', height: '2.6rem', padding: '0 12px',
        borderRadius: 10,
        border: '1px solid rgba(209,196,240,0.8)',
        background: 'rgba(237,234,248,0.30)',
        fontFamily: 'Outfit,sans-serif', fontSize: '0.88rem',
        color: value ? '#3B0764' : 'rgba(91,33,182,0.50)',
        outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
      }}
    >
      <option value="">{placeholder || 'Select…'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ReadonlyChip({ value, captured }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 50,
      background: 'rgba(5,150,105,0.10)', color: '#047857',
      fontSize: '0.84rem', fontWeight: 600,
      alignSelf: 'flex-start',
    }}>
      {value}
      {captured && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </span>
  );
}

const fieldLabelStyle = {
  fontSize: '0.80rem',
  fontWeight: 700,
  color: '#3B0764',
};

const inputStyle = {
  width: '100%', height: '2.6rem', padding: '0 12px',
  borderRadius: 10,
  border: '1px solid rgba(209,196,240,0.8)',
  background: 'rgba(237,234,248,0.30)',
  fontFamily: 'Outfit,sans-serif', fontSize: '0.88rem',
  color: '#3B0764', outline: 'none', boxSizing: 'border-box',
};
