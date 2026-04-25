import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import { pixelInitiateRegistration, pixelLead, pixelCompleteRegistration, pixelFormAbandoned } from '../utils/pixel';

const slideIn = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

function validate(fullName, whatsappNumber, email) {
  const errs = {};
  if (!/^[a-zA-Z\s]{2,}$/.test(fullName.trim())) errs.fullName = true;
  if (!/^\d{10}$/.test(whatsappNumber)) errs.whatsappNumber = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = true;
  return errs;
}

/* ── Link expiry countdown for success sheet ────────────────────────── */
function LinkExpiryTimer() {
  const [secs, setSecs] = useState(5 * 60);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const fmt = (n) => String(n).padStart(2, '0');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(239,68,68,0.35)',
      borderRadius: 10, padding: '8px 16px', marginBottom: 4,
    }}>
      <span style={{ fontSize: '0.9rem' }}>⏰</span>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Link Expires In
      </span>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem', fontWeight: 800, color: '#EF4444', letterSpacing: '0.06em' }}>
        {fmt(m)}:{fmt(s)}
      </span>
    </div>
  );
}

/* ── 5-minute urgency countdown ─────────────────────────────────────── */
function UrgencyTimer() {
  const [secs, setSecs] = useState(5 * 60); // 5 minutes
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const fmt = (n) => String(n).padStart(2, '0');
  const pulse = secs <= 60; // pulse when under 1 min

  return (
    <motion.div
      animate={{
        boxShadow: [
          '0 0 10px 2px rgba(239,68,68,0.30), 0 0 30px 6px rgba(239,68,68,0.10)',
          '0 0 22px 8px rgba(239,68,68,0.80), 0 0 60px 20px rgba(239,68,68,0.35)',
          '0 0 10px 2px rgba(239,68,68,0.30), 0 0 30px 6px rgba(239,68,68,0.10)',
        ],
        borderColor: [
          'rgba(239,68,68,0.45)',
          'rgba(239,68,68,0.95)',
          'rgba(239,68,68,0.45)',
        ],
      }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'rgba(220,38,38,0.18)',
        border: '1px solid rgba(239,68,68,0.45)',
        borderRadius: 12, padding: '8px 20px',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        width: '100%',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }}
      />
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,160,160,0.80)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Complete in
      </span>
      <motion.span
        animate={{ color: ['#EF4444', '#ff8080', '#EF4444'] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.06em' }}
      >
        {fmt(m)}:{fmt(s)}
      </motion.span>
      <span style={{ fontSize: '0.9rem' }}>⚠️</span>
    </motion.div>
  );
}

export default function Screen4() {
  const { state, dispatch } = useFunnel();
  const lang = state.lang;
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(state.fullName);
  const [whatsappNumber, setWhatsappNumber] = useState(state.whatsappNumber);
  const [email, setEmail] = useState(state.email);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');
  const hasStartedRef = useRef(false);
  const abandonRef = useRef(null);

  useEffect(() => {
    if (!state.sugarLevel) navigate('/', { replace: true });
  }, []);

  useEffect(() => {
    abandonRef.current = setTimeout(() => {
      if (!submitting) pixelFormAbandoned();
    }, 30000);
    return () => clearTimeout(abandonRef.current);
  }, []);

  function handleFirstInput() {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      pixelInitiateRegistration();
    }
  }

  function handlePhoneInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWhatsappNumber(val);
    handleFirstInput();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(fullName, whatsappNumber, email);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError('');
    clearTimeout(abandonRef.current);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          whatsapp_number: whatsappNumber,
          email: email.trim().toLowerCase(),
          sugar_level: state.sugarLevel,
          diabetes_duration: state.diabetesDuration || 'mid',
          language_pref: state.lang,
          ...state.utm,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setServerError(t.screen4.paused[lang]);
        setSubmitting(false);
        return;
      }
      if (!res.ok || !data.success) {
        setServerError('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      pixelLead({ full_name: fullName, email, whatsapp_number: whatsappNumber });
      pixelCompleteRegistration({ lead_score: data.lead_score });

      dispatch({ type: 'SET_FORM_FIELD', field: 'fullName', value: fullName });
      dispatch({ type: 'SET_FORM_FIELD', field: 'whatsappNumber', value: whatsappNumber });
      dispatch({ type: 'SET_FORM_FIELD', field: 'email', value: email });
      dispatch({
        type: 'SET_SUBMITTED',
        payload: { leadId: data.lead_id, leadScore: data.lead_score, whatsappGroupLink: data.whatsapp_link },
      });

      setWaLink(data.whatsapp_link || '');
      setSubmitting(false);
      setShowSuccess(true);
    } catch {
      setServerError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  const isPhoneValid = /^\d{10}$/.test(whatsappNumber);

  /* ── Shared glass input style ── */
  const inputStyle = (hasError) => ({
    width: '100%', height: '3.2rem',
    paddingLeft: '1rem', paddingRight: '1rem',
    borderRadius: 14,
    border: hasError ? '1px solid rgba(248,113,113,0.60)' : '1px solid rgba(255,255,255,0.18)',
    background: hasError ? 'rgba(254,100,100,0.10)' : 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.20)',
    fontSize: '1rem',
    fontFamily: 'Outfit, sans-serif',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 200ms',
  });

  const labelStyle = {
    display: 'block',
    fontFamily: 'Outfit, sans-serif',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'rgba(200,180,255,0.80)',
    marginBottom: '0.35rem',
  };

  return (
    <motion.div variants={slideIn} initial="initial" animate="animate" exit="exit"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Fixed top: urgency countdown ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        padding: '10px 16px',
        background: 'transparent',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        zIndex: 50,
      }}>
        <UrgencyTimer />
      </div>


      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '80px 16px 120px' }}>

      {/* ── Headline ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 style={{
          fontFamily: '"Montserrat", Outfit, sans-serif', fontWeight: 900,
          fontSize: 'clamp(1.5rem, 7vw, 2rem)', lineHeight: 1.15,
          color: '#ffffff', marginBottom: 4,
        }}>
          Reserve Your{' '}
          <span style={{
            background: 'linear-gradient(90deg, #F5C518, #FBBF24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>FREE</span>{' '}Seat
        </h1>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: 'rgba(200,180,255,0.65)', marginBottom: 14 }}>
          Fill in your details below to confirm your spot
        </p>
      </motion.div>

      {/* ── Webinar details pills ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{
          display: 'flex', flexWrap: 'nowrap', gap: 6, marginBottom: 14,
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
        {[
          {
            text: 'Every Sat & Tue',
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            ),
          },
          {
            text: '7:00 PM IST',
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
          },
          {
            text: 'Zoom Live',
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            ),
          },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 20, padding: '5px 11px',
          }}>
            {item.icon}
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: 'rgba(220,210,255,0.90)', whiteSpace: 'nowrap' }}>{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Based on your answers ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(200,180,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Based on your answers:
        </p>
        {[
          `You have diabetes (${state.sugarLevel === '250+' ? '250+ mg/dL' : '150–250 mg/dL'} sugar level)`,
          'Tamil is comfortable for you',
          'This session is built for YOU.',
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
            <span style={{ color: '#34D399', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{
              fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem',
              color: i === 2 ? '#A78BFA' : 'rgba(220,210,255,0.85)',
              fontWeight: i === 2 ? 700 : 500,
              fontStyle: i === 2 ? 'italic' : 'normal',
            }}>{line}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Social proof ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}
        />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', color: 'rgba(200,180,255,0.70)', fontWeight: 500 }}>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>347 people</span> have registered in the last 24 hours
        </span>
      </motion.div>

      {/* ── Form ── */}
      <form id="reg-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Full Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => { setFullName(e.target.value); handleFirstInput(); }}
            placeholder="Ramaswamy"
            autoCapitalize="words"
            style={inputStyle(errors.fullName)}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.15), inset 0 1.5px 0 rgba(255,255,255,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = errors.fullName ? 'rgba(248,113,113,0.60)' : 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'inset 0 1.5px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.20)'; }}
          />
          {errors.fullName && (
            <p style={{ fontFamily: 'Outfit, sans-serif', color: '#F87171', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {t.screen4.errorName[lang]}
            </p>
          )}
        </motion.div>

        {/* WhatsApp */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <label style={labelStyle}>WhatsApp Number</label>
          <div style={{
            display: 'flex', alignItems: 'center', borderRadius: 14, height: '3.2rem', overflow: 'hidden',
            border: errors.whatsappNumber ? '1px solid rgba(248,113,113,0.60)' : '1px solid rgba(255,255,255,0.18)',
            background: errors.whatsappNumber ? 'rgba(254,100,100,0.10)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.20)',
            transition: 'all 200ms',
          }}>
            <span style={{
              padding: '0 12px', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              color: 'rgba(200,180,255,0.70)', fontSize: '0.9rem',
              borderRight: '1px solid rgba(255,255,255,0.12)',
              height: '100%', display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)', flexShrink: 0,
            }}>+91</span>
            <input
              type="tel" inputMode="numeric"
              value={whatsappNumber} onChange={handlePhoneInput}
              placeholder="98XXX XXXXX"
              style={{
                flex: 1, padding: '0 12px', background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'Outfit, sans-serif', fontSize: '1rem', color: '#ffffff',
              }}
            />
            {isPhoneValid && (
              <span style={{ paddingRight: 12, color: '#34D399', fontWeight: 800, fontSize: '1.1rem' }}>✓</span>
            )}
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', color: 'rgba(200,180,255,0.55)', marginTop: 4 }}>
            🔒 All Workshop bonuses and Diabetic guides will be shared to your WhatsApp
          </p>
          {errors.whatsappNumber && (
            <p style={{ fontFamily: 'Outfit, sans-serif', color: '#F87171', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {t.screen4.errorPhone[lang]}
            </p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); handleFirstInput(); }}
            placeholder="yourname@gmail.com"
            style={inputStyle(errors.email)}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,33,182,0.15), inset 0 1.5px 0 rgba(255,255,255,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = errors.email ? 'rgba(248,113,113,0.60)' : 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'inset 0 1.5px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.20)'; }}
          />
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', color: 'rgba(200,180,255,0.55)', marginTop: 4 }}>
            ✉ Workshop Free Joining link will be sent to your email
          </p>
          {errors.email && (
            <p style={{ fontFamily: 'Outfit, sans-serif', color: '#F87171', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ {t.screen4.errorEmail[lang]}
            </p>
          )}
        </motion.div>

        {serverError && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(248,113,113,0.35)',
            borderRadius: 12, padding: '10px 14px',
            fontFamily: 'Outfit, sans-serif', color: '#FCA5A5', fontSize: '0.85rem',
          }}>
            {serverError}
          </div>
        )}

      </form>
      </div>{/* end scrollable body */}

      {/* ── Fixed bottom: submit button ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        padding: '12px 16px 20px',
        background: 'transparent',
        zIndex: 50,
      }}>
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, borderRadius: 50, background: 'rgba(139,92,246,0.55)', filter: 'blur(12px)', zIndex: 0 }}
          />
          <motion.button
            type="submit"
            form="reg-form"
            disabled={submitting}
            animate={submitting ? {} : {
              scale: [1, 1.03, 1],
              boxShadow: ['0 4px 20px rgba(91,33,182,0.45)', '0 6px 36px rgba(139,92,246,0.85)', '0 4px 20px rgba(91,33,182,0.45)'],
            }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', height: '3.5rem',
              background: submitting ? 'rgba(91,33,182,0.60)' : 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              border: 'none', borderRadius: 50,
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1.05rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Reserving your seat...
              </>
            ) : 'COMPLETE REGISTRATION →'}
          </motion.button>
        </div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', color: 'rgba(200,180,255,0.45)', textAlign: 'center', marginTop: 6 }}>
          By joining, you agree to our{' '}
          <span style={{ color: 'rgba(167,139,250,0.75)', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
          {' & '}
          <span style={{ color: 'rgba(167,139,250,0.75)', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
        </p>
      </div>

      {/* ── Success bottom sheet ── */}
      <AnimatePresence>
        {showSuccess && (
          <>
            {/* Backdrop */}
            <motion.div
              key="success-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', background: 'rgba(10,0,30,0.65)' }}
            />

            {/* Sheet */}
            <motion.div
              key="success-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxWidth: 480, margin: '0 auto',
                zIndex: 61,
                background: 'linear-gradient(160deg, rgba(30,8,70,0.97) 0%, rgba(18,4,52,0.99) 100%)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                border: '1px solid rgba(139,92,246,0.35)',
                borderBottom: 'none',
                borderRadius: '24px 24px 0 0',
                padding: '12px 24px 44px',
                boxShadow: '0 -16px 80px 24px rgba(91,33,182,0.55), 0 -4px 24px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              {/* Drag handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 20px' }} />

              {/* Confirm label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 20 }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.1 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}
                />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.70rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Confirm Your Registration
                </span>
              </div>

              {/* WhatsApp icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(37,211,102,0.45)',
                }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <h2 style={{ fontFamily: '"Montserrat", Outfit, sans-serif', fontWeight: 900, fontSize: '1.35rem', color: '#ffffff', textAlign: 'center', marginBottom: 8, lineHeight: 1.2 }}>
                Join the <span style={{ color: '#25D366' }}>WhatsApp Group</span>
              </h2>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
                All workshop <strong style={{ color: '#ffffff' }}>bonuses</strong> and the <strong style={{ color: '#ffffff' }}>joining link</strong> will be sent inside the WhatsApp group
              </p>

              {/* Expiry timer */}
              <LinkExpiryTimer />

              {/* Join button */}
              <motion.a
                href={waLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => navigate('/thankyou'), 800)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', height: '3.5rem', borderRadius: 50, marginTop: 12,
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#ffffff', fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700, fontSize: '1.05rem',
                  textDecoration: 'none',
                  boxShadow: '0 6px 28px rgba(37,211,102,0.45)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Join WhatsApp Group
              </motion.a>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(139,92,246,0.35) !important; }
      `}</style>
    </motion.div>
  );
}
