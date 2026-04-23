import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import TopBar from '../components/TopBar';

import TrustBar from '../components/TrustBar';
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
  const hasStartedRef = useRef(false);
  const abandonRef = useRef(null);

  useEffect(() => {
    if (!state.sugarLevel || !state.diabetesDuration) navigate('/', { replace: true });
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
          diabetes_duration: state.diabetesDuration,
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

      navigate('/thankyou');
    } catch {
      setServerError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  const isPhoneValid = /^\d{10}$/.test(whatsappNumber);

  return (
    <motion.div variants={slideIn} initial="initial" animate="animate" exit="exit" className="flex flex-col min-h-screen">
      <TopBar showBack backPath="/duration" step={3} />
      

      <form onSubmit={handleSubmit} className="flex-1 px-4 pb-6 flex flex-col gap-5">
        <h2 className="font-heading text-2xl font-bold text-purple-900 leading-tight">
          {t.screen4.headline[lang]}
        </h2>

        {/* Full Name */}
        <div>
          <label className="field-label">{t.screen4.nameLabel[lang]}</label>
          <input
            type="text"
            value={fullName}
            onChange={e => { setFullName(e.target.value); handleFirstInput(); }}
            placeholder={t.screen4.namePlaceholder[lang]}
            autoCapitalize="words"
            className={`field-input ${errors.fullName ? 'field-input-error' : ''}`}
          />
          {errors.fullName && (
            <p className="font-sans text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <span>⚠</span> {t.screen4.errorName[lang]}
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="field-label">{t.screen4.phoneLabel[lang]}</label>
          <div style={{
            display: 'flex', alignItems: 'center',
            borderRadius: 14, height: '3.5rem', overflow: 'hidden',
            border: errors.whatsappNumber ? '1px solid rgba(248,113,113,0.6)' : '1px solid rgba(255,255,255,0.80)',
            background: errors.whatsappNumber ? 'rgba(254,242,242,0.65)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 2px 10px rgba(91,33,182,0.07)',
            transition: 'all 200ms',
          }}>
            <span style={{
              padding: '0 12px', fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              color: 'rgba(91,33,182,0.55)', fontSize: '0.875rem',
              borderRight: '1px solid rgba(91,33,182,0.12)',
              height: '100%', display: 'flex', alignItems: 'center',
              background: 'rgba(237,234,248,0.40)', flexShrink: 0,
            }}>
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={whatsappNumber}
              onChange={handlePhoneInput}
              placeholder="98XXX XXXXX"
              className="flex-1 px-3 font-sans text-base outline-none bg-transparent"
            />
            {isPhoneValid && (
              <span className="pr-3 text-brand-green font-bold text-lg">✓</span>
            )}
          </div>
          <p className="font-sans text-xs text-purple-400 mt-1.5">{t.screen4.phoneHelper[lang]}</p>
          {errors.whatsappNumber && (
            <p className="font-sans text-red-500 text-xs mt-1 flex items-center gap-1">
              <span>⚠</span> {t.screen4.errorPhone[lang]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="field-label">{t.screen4.emailLabel[lang]}</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); handleFirstInput(); }}
            placeholder={t.screen4.emailPlaceholder[lang]}
            className={`field-input ${errors.email ? 'field-input-error' : ''}`}
          />
          <p className="font-sans text-xs text-purple-400 mt-1.5">{t.screen4.emailHelper[lang]}</p>
          {errors.email && (
            <p className="font-sans text-red-500 text-xs mt-1 flex items-center gap-1">
              <span>⚠</span> {t.screen4.errorEmail[lang]}
            </p>
          )}
        </div>

        {/* Consent */}
        <div className="flex items-start gap-2.5">
          <input type="checkbox" defaultChecked id="consent"
            className="mt-0.5 w-4 h-4 accent-purple rounded" />
          <label htmlFor="consent" className="font-sans text-xs text-purple-400 leading-relaxed">
            {t.screen4.consent[lang]}
          </label>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-[14px] px-4 py-3 font-sans text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <div className="mt-auto space-y-3">
          <motion.button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            animate={submitting ? {} : { scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {t.screen4.submitting[lang]}
              </span>
            ) : t.screen4.cta[lang]}
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🔒', text: t.screen4.trustPrivate[lang] },
              { icon: '🚫', text: t.screen4.trustNoSpam[lang] },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-1.5 rounded-[10px] px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.75)' }}>
                <span className="text-sm flex-shrink-0">{item.icon}</span>
                <span className="font-sans text-[11px] text-purple-600 leading-tight">{item.text}</span>
              </div>
            ))}
          </div>

          <TrustBar />
        </div>
      </form>
    </motion.div>
  );
}
