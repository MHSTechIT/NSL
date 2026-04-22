import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import CountdownTimer, { stopTick } from '../components/CountdownTimer';
import LanguageToggle from '../components/LanguageToggle';
import TrustBar from '../components/TrustBar';
import {
  pixelPageView, pixelViewContent, pixelInitiateQualification,
  pixelDisqualifiedLead, pixelSugarLevelSelected, pixelLanguageQualified,
} from '../utils/pixel';

const sugarOptions = [
  { id: '150-250', labelEn: '150 – 250 mg/dL',     labelTa: '150–250 mg/dL',         disqualify: false },
  { id: '250+',   labelEn: 'Above 250 mg/dL',       labelTa: '250-க்கு மேல்',          disqualify: false },
  { id: 'none',   labelEn: "I Don't Have Diabetes", labelTa: 'சர்க்கரை நோய் இல்லை', disqualify: true  },
];

export default function Screen1A() {
  const { state, dispatch } = useFunnel();
  const lang = state.lang;
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const countRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // 'sugar' → first question, 'language' → second question inline
  const [popupStep, setPopupStep] = useState('sugar');

  useEffect(() => {
    pixelPageView();
    pixelViewContent(state.utm);
  }, []);

  // Intercept browser/device back button while popup is open
  useEffect(() => {
    if (!expanded) return;
    window.history.pushState({ popup: true }, '');
    const onPop = () => {
      if (popupStep === 'language') {
        setPopupStep('sugar');
        window.history.pushState({ popup: true }, '');
      } else {
        setExpanded(false);
        setPopupStep('sugar');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [expanded, popupStep]);

  useEffect(() => {
    if (countRef.current) return;
    countRef.current = true;
    const target = 15000;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);

  function handleSugarSelect(opt) {
    stopTick();
    if (opt.disqualify) {
      dispatch({ type: 'SET_NAV_DIRECTION', payload: 'forward' });
      setLeaving(true);
      setTimeout(() => {
        pixelDisqualifiedLead('no_diabetes', state.utm);
        navigate('/not-eligible');
      }, 420);
      return;
    }
    dispatch({ type: 'SET_SUGAR_LEVEL', payload: opt.id });
    pixelSugarLevelSelected(opt.id);
    pixelInitiateQualification(state.utm);
    setPopupStep('language');
  }

  function handleLanguageYes() {
    stopTick();
    dispatch({ type: 'SET_LANGUAGE_QUALIFIED', payload: true });
    dispatch({ type: 'SET_NAV_DIRECTION', payload: 'forward' });
    pixelLanguageQualified();
    setExpanded(false);
    setPopupStep('sugar');
    setTimeout(() => navigate('/duration'), 380);
  }

  function handleLanguageNo() {
    stopTick();
    dispatch({ type: 'SET_NAV_DIRECTION', payload: 'forward' });
    pixelDisqualifiedLead('language_mismatch', state.utm);
    setExpanded(false);
    setPopupStep('sugar');
    setTimeout(() => navigate('/language-mismatch'), 420);
  }

  function handleClose() {
    setExpanded(false);
    setPopupStep('sugar');
  }

  const cardAnim = (i) => ({
    initial: { y: 0, opacity: 1 },
    animate: leaving
      ? { y: 100, opacity: 0, transition: { duration: 0.28, delay: i * 0.05, ease: [0.32, 0, 0.67, 0] } }
      : { y: 0, opacity: 1 },
  });

  const pillStyle = {
    width: '100%', padding: '13px 16px',
    borderRadius: 50,
    background: 'rgba(237,234,248,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#3B0764',
    border: '1px solid rgba(255,255,255,0.8)',
    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(91,33,182,0.10)',
  };

  return (
    <div className="flex flex-col min-h-screen pb-6">
      {/* Top bar — language toggle only */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 10px' }}>
        <LanguageToggle />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4">

        {/* Live badge */}
        <motion.div {...cardAnim(0)}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 2px 10px rgba(91,33,182,0.10)',
            borderRadius: 50, padding: '5px 14px',
          }}>
            <motion.span
              animate={leaving ? {} : { opacity: [1, 0.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', flexShrink: 0, display: 'inline-block' }}
            />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.76rem', color: '#3B0764' }}>
              {lang === 'tamil' ? 'நேரலை பதிவு திறந்துள்ளது' : 'Live Registration Open'}
            </span>
          </div>
        </motion.div>

        {/* Hero — image behind the card, card overlaps image bottom */}
        <motion.div {...cardAnim(1)} style={{ position: 'relative' }}>
          {/* Person image — behind card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -80, position: 'relative', zIndex: 0, pointerEvents: 'none', userSelect: 'none' }}>
            <img src="/person.webp" alt="" style={{ width: '82%', maxWidth: 300, display: 'block' }} />
          </div>
          {/* Glass card — in front, covers lower part of image, minimal top padding */}
          <div className="glass-card" style={{ paddingTop: 20, paddingBottom: 22, paddingLeft: 20, paddingRight: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.95rem', color: '#1a0533', lineHeight: 1.18, textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: 10 }}>
              {t.screen1A.headline[lang]}
            </h1>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', color: '#5B21B6', lineHeight: 1.55, fontWeight: 500 }}>
              {t.screen1A.subheadline[lang]}
            </p>
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div {...cardAnim(2)}><CountdownTimer /></motion.div>

        {/* Social proof */}
        <motion.div className="card px-4 py-3 flex items-center gap-3" {...cardAnim(3)}>
          <div>
            <p className="font-heading font-bold text-purple-900 text-2xl leading-tight">{count.toLocaleString('en-IN')}+</p>
            <p className="font-sans text-xs text-purple-400">{t.screen1A.registeredCount[lang]}</p>
          </div>
          <div className="ml-auto">
            <span className="purple-badge">This Week</span>
          </div>
        </motion.div>

        {/* ── CTA section ── */}
        <motion.div className="mt-auto pt-2 pb-2" {...cardAnim(4)}>
          <motion.button
            onClick={() => { stopTick(); setExpanded(true); }}
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
            style={{
              width: '100%', height: '3.5rem',
              background: '#5B21B6',
              border: 'none', borderRadius: 50,
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1.1rem',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(91,33,182,0.35)',
            }}
          >
            {t.screen1A.cta[lang]}
          </motion.button>

          <p className="text-center font-sans text-xs text-purple-400 mt-3">{t.screen1A.seats[lang]}</p>
          <TrustBar />
        </motion.div>

        {/* ── Blur backdrop ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="blur-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                background: 'rgba(15,0,40,0.35)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Popup panel ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded-overlay"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.35, ease: [0.32, 0, 0.67, 0] } }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
                zIndex: 50, padding: '0 20px', paddingBottom: 0,
              }}
            >
              {/* ── Floating image — swaps between gmeter and zoom ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '-40px',
                pointerEvents: 'none',
                position: 'relative', zIndex: 1,
              }}>
                <AnimatePresence mode="wait">
                  {popupStep === 'sugar' ? (
                    <motion.img
                      key="gmeter"
                      src="/gmeter.png"
                      alt=""
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.35, delay: 0.05 }}
                      style={{ width: '58%', maxWidth: 220, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
                    />
                  ) : (
                    <motion.img
                      key="zoom"
                      src="/zoom.png"
                      alt=""
                      initial={{ opacity: 0, scale: 0.75, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      style={{ width: '58%', maxWidth: 220, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.30))' }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* ── Card ── */}
              <div style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '22px 22px 0 0',
                border: '1px solid rgba(255,255,255,0.75)',
                borderBottom: 'none',
                boxShadow: '0 -8px 32px rgba(91,33,182,0.14)',
                position: 'relative', zIndex: 2,
                overflow: 'hidden',
              }}>
                <AnimatePresence mode="wait">

                  {/* ── Step 1: Sugar level ── */}
                  {popupStep === 'sugar' && (
                    <motion.div
                      key="sugar-step"
                      initial={{ opacity: 0, x: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30, transition: { duration: 0.22 } }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                      style={{ padding: '20px 16px 28px' }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <p style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700, fontSize: '1.45rem',
                          color: '#3B0764', margin: 0,
                        }}>
                          {lang === 'tamil' ? 'உங்கள் சர்க்கரை அளவு?' : 'your sugar level?'}
                        </p>
                        <button onClick={handleClose} style={{
                          background: 'rgba(91,33,182,0.08)',
                          border: '1px solid rgba(91,33,182,0.18)',
                          borderRadius: '50%', width: 28, height: 28,
                          cursor: 'pointer', color: '#5B21B6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', flexShrink: 0,
                        }}>✕</button>
                      </div>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {sugarOptions.map((opt, i) => (
                          <motion.button
                            key={opt.id}
                            onClick={() => handleSugarSelect(opt)}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.07 }}
                            whileTap={{ scale: 0.97 }}
                            style={pillStyle}
                          >
                            {lang === 'tamil' ? opt.labelTa : opt.labelEn}
                          </motion.button>
                        ))}
                      </div>

                      <p style={{ textAlign: 'center', marginTop: 12, fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', color: 'rgba(91,33,182,0.45)' }}>
                        🔒 {lang === 'tamil' ? '100% தனிப்பட்டது & பாதுகாப்பானது' : '100% Private & Secure'}
                      </p>
                    </motion.div>
                  )}

                  {/* ── Step 2: Language qualifier ── */}
                  {popupStep === 'language' && (
                    <motion.div
                      key="language-step"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30, transition: { duration: 0.22 } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ padding: '20px 16px 28px' }}
                    >
                      {/* Header with back button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <button onClick={() => setPopupStep('sugar')} style={{ background: 'transparent', border: '2px solid #5B21B6', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', color: 'rgba(91,33,182,0.55)', margin: 0 }}>
                          🎙️ {t.screen2.note[lang]}
                        </p>
                      </div>

                      {/* Question */}
                      <h2 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700, fontSize: '1.45rem',
                        color: '#3B0764',
                        marginBottom: 18, lineHeight: 1.2,
                      }}>
                        {t.screen2.question[lang]}
                      </h2>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { label: t.screen2.yes[lang], action: handleLanguageYes },
                          { label: t.screen2.no[lang],  action: handleLanguageNo  },
                        ].map(({ label, action }, i) => (
                          <motion.button
                            key={i}
                            onClick={action}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.08 }}
                            whileTap={{ scale: 0.97 }}
                            style={pillStyle}
                          >
                            {label}
                          </motion.button>
                        ))}
                      </div>

                      <p style={{ textAlign: 'center', marginTop: 14, fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', color: 'rgba(91,33,182,0.40)' }}>
                        🔒 {lang === 'tamil' ? '100% தனிப்பட்டது & பாதுகாப்பானது' : '100% Private & Secure'}
                      </p>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
