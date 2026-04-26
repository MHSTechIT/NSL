import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import CountdownTimer, { stopTick } from '../components/CountdownTimer';
import Confetti from '../components/Confetti';
import TrustBar from '../components/TrustBar';
import {
  pixelPageView, pixelViewContent, pixelInitiateQualification,
  pixelDisqualifiedLead, pixelSugarLevelSelected,
} from '../utils/pixel';

/* ── Live social proof messages ───────────────────────────────────────── */
const LIVE_MSGS = [
  'Arun from Madurai joined 2 minutes ago','Karthik from Madurai joined 1 minute ago','Vijay from Perambalur joined 4 minutes ago','Suresh from Krishnagiri joined 1 minute ago','Ramesh from Madurai joined 3 minutes ago','Ganesh from Sivakasi joined 1 minute ago','Dinesh from Trichy joined 4 minutes ago','Prakash from Dharmapuri joined 1 minute ago','Senthil from Tenkasi joined 2 minutes ago','Rajesh from Nagercoil joined 3 minutes ago','Kumar from Cuddalore joined 3 minutes ago','Mani from Thoothukudi joined 4 minutes ago','Babu from Vellore joined 2 minutes ago','Mohan from Perambalur joined 4 minutes ago','Saravanan from Tirunelveli joined 3 minutes ago','Naveen from Mayiladuthurai joined 2 minutes ago','Ajith from Tenkasi joined 4 minutes ago','Vignesh from Madurai joined 3 minutes ago','Harish from Nagercoil joined 2 minutes ago','Lokesh from Karur joined 1 minute ago','Pradeep from Thanjavur joined 4 minutes ago','Deepak from Mayiladuthurai joined 3 minutes ago','Santhosh from Tiruppur joined 4 minutes ago','Anand from Pollachi joined 2 minutes ago','Raja from Dharmapuri joined 1 minute ago','Gopi from Pollachi joined 1 minute ago','Selvam from Ramanathapuram joined 3 minutes ago','Elango from Tiruppur joined 3 minutes ago','Bala from Perambalur joined 1 minute ago','Kannan from Thoothukudi joined 1 minute ago','Murugan from Chennai joined 4 minutes ago','Shankar from Dharmapuri joined 4 minutes ago','Vasu from Vellore joined 4 minutes ago','Ravi from Dharmapuri joined 2 minutes ago','Aravind from Tiruppur joined 4 minutes ago','Siva from Nagapattinam joined 4 minutes ago','Jegan from Kanchipuram joined 3 minutes ago','Sakthivel from Sivakasi joined 3 minutes ago','Karthikeyan from Tenkasi joined 1 minute ago','Nithin from Hosur joined 4 minutes ago','Rahul from Madurai joined 4 minutes ago','Surya from Salem joined 1 minute ago','Yuvan from Pudukkottai joined 2 minutes ago','Ajay from Mayiladuthurai joined 1 minute ago','Kiran from Dharmapuri joined 3 minutes ago','Roshan from Vellore joined 4 minutes ago','Vinoth from Pudukkottai joined 4 minutes ago','Bharath from Salem joined 4 minutes ago','Madan from Salem joined 1 minute ago','Udhay from Cuddalore joined 4 minutes ago','Abirami from Tirunelveli joined 1 minute ago','Anitha from Ramanathapuram joined 2 minutes ago','Kavitha from Dindigul joined 2 minutes ago','Divya from Chennai joined 4 minutes ago','Priya from Virudhunagar joined 2 minutes ago','Nithya from Karur joined 2 minutes ago','Swathi from Vellore joined 3 minutes ago','Revathi from Perambalur joined 4 minutes ago','Lakshmi from Virudhunagar joined 4 minutes ago','Meena from Pollachi joined 2 minutes ago','Kalai from Tirunelveli joined 4 minutes ago','Raji from Pollachi joined 2 minutes ago','Latha from Kanchipuram joined 2 minutes ago','Geetha from Chennai joined 1 minute ago','Saranya from Coimbatore joined 1 minute ago','Harini from Trichy joined 1 minute ago','Janani from Ramanathapuram joined 1 minute ago','Keerthana from Virudhunagar joined 1 minute ago','Aarthi from Thanjavur joined 1 minute ago','Pavithra from Dharmapuri joined 3 minutes ago','Deepa from Dindigul joined 4 minutes ago','Shalini from Perambalur joined 4 minutes ago','Suganya from Dindigul joined 3 minutes ago','Vidhya from Villupuram joined 4 minutes ago','Mahalakshmi from Kanchipuram joined 4 minutes ago','Sudha from Krishnagiri joined 2 minutes ago','Uma from Krishnagiri joined 3 minutes ago','Radha from Madurai joined 2 minutes ago','Bhavani from Hosur joined 1 minute ago','Chitra from Thoothukudi joined 3 minutes ago','Malathi from Cuddalore joined 4 minutes ago','Sangeetha from Kanchipuram joined 3 minutes ago','Yamini from Virudhunagar joined 1 minute ago','Rukmini from Cuddalore joined 3 minutes ago','Indira from Cuddalore joined 4 minutes ago','Jaya from Nagapattinam joined 1 minute ago','Preethi from Perambalur joined 4 minutes ago','Nandhini from Krishnagiri joined 3 minutes ago','Vaishnavi from Dharmapuri joined 2 minutes ago','Gayathri from Thoothukudi joined 1 minute ago','Mythili from Krishnagiri joined 2 minutes ago','Hema from Thanjavur joined 3 minutes ago','Rekha from Madurai joined 3 minutes ago','Kowsalya from Madurai joined 3 minutes ago','Vani from Pollachi joined 3 minutes ago','Nisha from Perambalur joined 1 minute ago','Shruthi from Trichy joined 1 minute ago','Sowmya from Ramanathapuram joined 2 minutes ago','Roja from Erode joined 4 minutes ago','Kala from Thanjavur joined 2 minutes ago',
];

const sugarOptions = [
  { id: '150-250', label: '150 – 250 mg/dL',     disqualify: false },
  { id: '250+',   label: 'Above 250 mg/dL',       disqualify: false },
  { id: 'none',   label: "I Don't Have Diabetes", disqualify: true  },
];

/* ── Phase styles (used in merged card) ──────────────────────────────── */
const PHASE_STYLES = {
  open:    { dot: '#F59E0B', glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.35)', textSub: 'rgba(253,211,77,0.85)' },
  closing: { dot: '#FB923C', glow: 'rgba(251,146,60,0.38)', border: 'rgba(251,146,60,0.38)', textSub: 'rgba(253,186,116,0.85)' },
  filling: { dot: '#F87171', glow: 'rgba(248,113,113,0.40)', border: 'rgba(248,113,113,0.40)', textSub: 'rgba(252,165,165,0.85)' },
  almost:  { dot: '#EF4444', glow: 'rgba(239,68,68,0.50)',  border: 'rgba(239,68,68,0.50)',  textSub: 'rgba(252,165,165,0.90)' },
  last:    { dot: '#EF4444', glow: 'rgba(239,68,68,0.60)',  border: 'rgba(239,68,68,0.60)',  textSub: 'rgba(252,165,165,0.95)' },
  ended:   { dot: '#EF4444', glow: 'rgba(239,68,68,0.60)',  border: 'rgba(239,68,68,0.60)',  textSub: 'rgba(252,165,165,0.95)' },
};

/* ── Merged Social Proof + Seat Badge card ────────────────────────────── */
const MAX_SEATS = 2000;

function SocialProofCard({ count, visibleMsgs, seatInfo }) {
  const progress = Math.min(count / MAX_SEATS, 1);
  const s = seatInfo ? PHASE_STYLES[seatInfo.styleKey] : PHASE_STYLES.open;
  const isLastChance = seatInfo?.phase === 5;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: `1px solid ${s.border}`,
      borderRadius: 16,
      padding: '14px 16px',
      boxShadow: `0 2px 16px rgba(91,33,182,0.10), inset 0 1px 0 rgba(255,255,255,0.60)`,
    }}>

      {/* ── Phase + seats row ── */}
      {seatInfo && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* Left: pulsing dot + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.dot }} />
              <motion.div
                animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: s.dot }}
              />
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: s.dot, margin: 0 }}>
              {seatInfo.label}
            </p>
          </div>
          {/* Right: seats left — plain text, no card */}
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.80rem', color: '#3b1f6e', whiteSpace: 'nowrap' }}>
            {seatInfo?.seats != null ? `${seatInfo.seats} left` : 'Almost full'}
          </span>
        </div>
      )}

      {/* ── Count row ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#2d0a6e', lineHeight: 1 }}>
          {count.toLocaleString('en-IN')}
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#5b3fa0' }}>
          Seats Reserved
        </span>
      </div>

      {/* ── Progress label (2000 cap) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', color: '#7c5cbf' }}>
          {Math.round(progress * 100)}% filled
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: '#5b3fa0' }}>
          2,000
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.10)', marginBottom: 12, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${s.dot}, rgba(167,139,250,0.90))`,
            boxShadow: `0 0 8px 1px ${s.glow}`,
          }}
        />
      </div>

      {/* ── Live feed rows ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {visibleMsgs.map((msg) => {
            const name = msg.split(' from ')[0];
            const rest = msg.split(' from ')[1] || '';
            const city = rest.split(' joined')[0];
            const time = msg.split('joined ')[1] || '';
            return (
              <motion.div
                key={msg}
                layout
                initial={{ opacity: 0, y: 32, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.50)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(91,33,182,0.08)',
                }}
              >
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#5b3fa0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                  <span style={{ fontWeight: 700, color: '#2d0a6e' }}>{name}</span>
                  {` from ${city} joined`}
                </span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', color: '#7c5cbf', flexShrink: 0 }}>
                  {time}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}

/* ── Seat badge logic (deterministic from time remaining) ─────────────── */
function getSeatInfo(nextWebinarAt) {
  if (!nextWebinarAt) return null;
  const diff = new Date(nextWebinarAt).getTime() - Date.now();
  const h = diff / (1000 * 60 * 60); // fractional hours left

  if (diff <= 0) return null;

  if (h < 2) {
    return { phase: 5, styleKey: 'last', seats: null, label: 'LAST CHANCE' };
  } else if (h < 12) {
    const seats = Math.max(3, Math.round(3 + (h - 2) / 10 * 9));
    return { phase: 4, styleKey: 'almost', seats, label: 'Almost Full' };
  } else if (h < 24) {
    const seats = Math.max(12, Math.round(12 + (h - 12) / 12 * 6));
    return { phase: 3, styleKey: 'filling', seats, label: 'Filling Fast' };
  } else if (h < 36) {
    const seats = Math.max(18, Math.round(18 + (h - 24) / 12 * 29));
    return { phase: 2, styleKey: 'closing', seats, label: 'Closing Soon' };
  } else {
    const seats = Math.min(187, Math.max(47, Math.round(47 + Math.min(h - 36, 36) / 36 * 140)));
    return { phase: 1, styleKey: 'open', seats, label: 'Live Registration Open' };
  }
}

export default function Screen1A() {
  const { state, dispatch } = useFunnel();
  const navigate = useNavigate();
  const [seatInfo, setSeatInfo] = useState(() => getSeatInfo(state.webinarConfig?.next_webinar_at));
  const [seatsReserved, setSeatsReserved] = useState(1813);
  const [visibleMsgs, setVisibleMsgs] = useState(() => LIVE_MSGS.slice(0, 2));
  const nextMsgIdxRef = useRef(2);
  const seatTimerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // 'sugar' → first question, 'language' → second question inline
  const [popupStep, setPopupStep] = useState('sugar');
  const [popupLeaving, setPopupLeaving] = useState(false);
  const [showEligible, setShowEligible] = useState(false);

  useEffect(() => {
    pixelPageView();
    pixelViewContent(state.utm);
  }, []);

  // Intercept browser/device back button while popup is open
  useEffect(() => {
    if (!expanded) return;
    window.history.pushState({ popup: true }, '');
    const onPop = () => {
      setExpanded(false);
      setPopupStep('sugar');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [expanded, popupStep]);

  // Update seat badge every second; auto-refresh when webinar starts
  useEffect(() => {
    const id = setInterval(() => {
      const info = getSeatInfo(state.webinarConfig?.next_webinar_at);
      setSeatInfo(info);
      // When countdown reaches 0 → reload so context recalculates next webinar
      if (!info) {
        const diff = state.webinarConfig?.next_webinar_at
          ? new Date(state.webinarConfig.next_webinar_at).getTime() - Date.now()
          : 1;
        if (diff <= 0) { clearInterval(id); window.location.reload(); }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.webinarConfig?.next_webinar_at]);

  // Seats reserved — increments every 45–90 seconds
  useEffect(() => {
    const schedule = () => {
      const delay = 45000 + Math.random() * 45000;
      seatTimerRef.current = setTimeout(() => {
        setSeatsReserved(p => p + 1);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(seatTimerRef.current);
  }, []);

  // Cycle live messages every 3.5 seconds — prepend new, drop oldest
  useEffect(() => {
    const id = setInterval(() => {
      const next = nextMsgIdxRef.current % LIVE_MSGS.length;
      nextMsgIdxRef.current = next + 1;
      setVisibleMsgs(prev => [...prev, LIVE_MSGS[next]].slice(-2));
    }, 3500);
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
    // Transition to zoom question step
    setPopupStep('zoom');
  }

  function handleZoomYes() {
    setPopupLeaving(true);
    setTimeout(() => {
      setExpanded(false);
      setPopupStep('sugar');
      setPopupLeaving(false);
      setShowEligible(true);
      setTimeout(() => navigate('/register'), 1800);
    }, 420);
  }

  function handleZoomNo() {
    dispatch({ type: 'SET_NAV_DIRECTION', payload: 'forward' });
    setLeaving(true);
    setTimeout(() => {
      pixelDisqualifiedLead('no_zoom', state.utm);
      navigate('/not-eligible');
    }, 420);
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
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    color: '#2d0a6e',
    border: '1px solid rgba(139,92,246,0.22)',
    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.80), 0 2px 8px rgba(91,33,182,0.10)',
    transition: 'all 180ms',
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar — removed */}

      <div className="flex-1 px-4 flex flex-col gap-4" style={{ overflowY: 'auto', paddingBottom: 100 }}>


        {/* Hero — image behind the card, card overlaps image bottom */}
        <motion.div {...cardAnim(1)} style={{ position: 'relative' }}>
          {/* Person image — behind card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -50, position: 'relative', zIndex: 0, pointerEvents: 'none', userSelect: 'none' }}>
            <img src="/person.webp" alt="" style={{ width: '55%', maxWidth: 200, display: 'block' }} />
          </div>
          {/* Glass card — in front, covers lower part of image, minimal top padding */}
          <div className="glass-card" style={{ paddingTop: 20, paddingBottom: 22, paddingLeft: 20, paddingRight: 20, textAlign: 'center', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.55)' }}>
            <h1 className="heading-shine" style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: 'clamp(1.45rem, 7vw, 1.9rem)', lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: 10 }}>
              <>REVERSE DIABETES<br />WITHOUT TABLETS</>
            </h1>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', color: '#3b1f6e', lineHeight: 1.55, fontWeight: 500 }}>
              {t.screen1A.subheadline.english}
            </p>
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div {...cardAnim(2)}><CountdownTimer /></motion.div>

        {/* Merged Social Proof + Seat Badge Card */}
        <motion.div {...cardAnim(3)}>
          <SocialProofCard count={seatsReserved} visibleMsgs={visibleMsgs} seatInfo={seatInfo} />
        </motion.div>

        {/* ── Blur backdrop ── */}
        <AnimatePresence>
          {(expanded || showEligible) && (
            <motion.div
              key="blur-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                background: 'rgba(100,70,180,0.15)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Eligible message ── */}
        <AnimatePresence>
          {showEligible && (
            <motion.div
              key="eligible-overlay"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 55,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 32px',
              }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderRadius: 24,
                padding: '32px 28px',
                textAlign: 'center',
                boxShadow: '0 4px 32px rgba(91,33,182,0.12), inset 0 1px 0 rgba(255,255,255,0.90)',
                border: '1px solid rgba(139,92,246,0.18)',
                maxWidth: 300,
                width: '100%',
              }}>
                {/* Animated check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
                  style={{
                    width: 68, height: 68, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 18px',
                    boxShadow: '0 0 0 10px rgba(34,197,94,0.12), 0 8px 32px rgba(34,197,94,0.50)',
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <motion.path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} />
                  </svg>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                  style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#2d0a6e', lineHeight: 1.25, marginBottom: 8 }}
                >
                  You are Eligible!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.3 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', color: '#15803d', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                >
                  Your spot for the FREE Webinar is waiting
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Popup panel ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded-overlay"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.42, ease: [0.32, 0, 0.67, 0] } }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
                zIndex: 50, padding: '0 20px', paddingBottom: 0,
              }}
            >
              {/* ── Floating countdown timer — full card above popup ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.3 }}
                style={{ marginBottom: 10 }}
              >
                <CountdownTimer />
              </motion.div>

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
                      src="/gmeter.webp"
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
                      src="/zoom.webp"
                      alt=""
                      initial={{ opacity: 0, scale: 0.75, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      style={{ width: '38%', maxWidth: 140, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.30))' }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* ── Card ── */}
              <div style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRadius: '22px 22px 0 0',
                border: '1px solid rgba(139,92,246,0.18)',
                borderBottom: 'none',
                boxShadow: '0 -4px 24px rgba(91,33,182,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
                position: 'relative', zIndex: 2,
              }}>
                <AnimatePresence mode="wait">

                  {/* ── Step 1: Sugar level ── */}
                  {popupStep === 'sugar' && (
                    <motion.div
                      key="sugar-step"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50, transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ padding: '20px 16px 28px' }}
                    >
                      {/* Header */}
                      <div style={{ marginBottom: 14 }}>
                        <p style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700, fontSize: '1.45rem',
                          color: '#2d0a6e', margin: 0,
                        }}>
                          Your Sugar Level?
                        </p>
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
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>

                    </motion.div>
                  )}

                  {/* ── Step 2: Zoom question ── */}
                  {popupStep === 'zoom' && (
                    <motion.div
                      key="zoom-step"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50, transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ padding: '20px 16px 28px' }}
                    >
                      {/* Small label */}
                      <p style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.78rem', color: '#7c5cbf',
                        fontWeight: 500, margin: '0 0 6px',
                      }}>
                        This webinar is conducted in Tamil
                      </p>

                      {/* Big question */}
                      <p style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700, fontSize: '1.45rem',
                        color: '#2d0a6e', margin: '0 0 16px', lineHeight: 1.2,
                      }}>
                        Do you understand Tamil?
                      </p>

                      {/* Yes / No buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <motion.button
                          onClick={handleZoomYes}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          whileTap={{ scale: 0.97 }}
                          style={pillStyle}
                        >
                          Yes, I understand Tamil
                        </motion.button>
                        <motion.button
                          onClick={handleZoomNo}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 }}
                          whileTap={{ scale: 0.97 }}
                          style={pillStyle}
                        >
                          No, I don't understand Tamil
                        </motion.button>
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        padding: '12px 16px 20px',
        background: 'transparent',
        zIndex: 30,
      }}>
        <div style={{ position: 'relative' }}>
          {/* Glow ring — pulses behind the button */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.15, 0.55] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              borderRadius: 50,
              background: 'rgba(139,92,246,0.55)',
              filter: 'blur(12px)',
              zIndex: 0,
            }}
          />
          <motion.button
            onClick={() => { stopTick(); setExpanded(true); }}
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                '0 4px 20px rgba(91,33,182,0.45)',
                '0 6px 36px rgba(139,92,246,0.85)',
                '0 4px 20px rgba(91,33,182,0.45)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', height: '3.5rem',
              background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
              border: 'none', borderRadius: 50,
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1.1rem',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {t.screen1A.cta.english}
          </motion.button>
        </div>
        <TrustBar />
      </div>

      {/* ── Confetti burst on eligible ── */}
      <Confetti active={showEligible} count={260} duration={5500} />

    </div>
  );
}
