import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import CountdownTimer, { stopTick } from '../components/CountdownTimer';
import LanguageToggle from '../components/LanguageToggle';
import TrustBar from '../components/TrustBar';
import {
  pixelPageView, pixelViewContent, pixelInitiateQualification,
  pixelDisqualifiedLead, pixelSugarLevelSelected, pixelLanguageQualified,
} from '../utils/pixel';

const LIVE_MESSAGES = [
  "Arun from Madurai joined 2 minutes ago","Karthik from Madurai joined 1 minutes ago","Vijay from Perambalur joined 4 minutes ago","Suresh from Krishnagiri joined 1 minutes ago","Ramesh from Madurai joined 3 minutes ago","Ganesh from Sivakasi joined 1 minutes ago","Dinesh from Trichy joined 4 minutes ago","Prakash from Dharmapuri joined 1 minutes ago","Senthil from Tenkasi joined 2 minutes ago","Rajesh from Nagercoil joined 3 minutes ago","Kumar from Cuddalore joined 3 minutes ago","Mani from Thoothukudi joined 4 minutes ago","Babu from Vellore joined 2 minutes ago","Mohan from Perambalur joined 4 minutes ago","Saravanan from Tirunelveli joined 3 minutes ago","Naveen from Mayiladuthurai joined 2 minutes ago","Ajith from Tenkasi joined 4 minutes ago","Vignesh from Madurai joined 3 minutes ago","Harish from Nagercoil joined 2 minutes ago","Lokesh from Karur joined 1 minutes ago","Pradeep from Thanjavur joined 4 minutes ago","Deepak from Mayiladuthurai joined 3 minutes ago","Santhosh from Tiruppur joined 4 minutes ago","Anand from Pollachi joined 2 minutes ago","Raja from Dharmapuri joined 1 minutes ago","Gopi from Pollachi joined 1 minutes ago","Selvam from Ramanathapuram joined 3 minutes ago","Elango from Tiruppur joined 3 minutes ago","Bala from Perambalur joined 1 minutes ago","Kannan from Thoothukudi joined 1 minutes ago","Murugan from Chennai joined 4 minutes ago","Shankar from Dharmapuri joined 4 minutes ago","Vasu from Vellore joined 4 minutes ago","Ravi from Dharmapuri joined 2 minutes ago","Aravind from Tiruppur joined 4 minutes ago","Siva from Nagapattinam joined 4 minutes ago","Jegan from Kanchipuram joined 3 minutes ago","Sakthivel from Sivakasi joined 3 minutes ago","Karthikeyan from Tenkasi joined 1 minutes ago","Nithin from Hosur joined 4 minutes ago","Rahul from Madurai joined 4 minutes ago","Surya from Salem joined 1 minutes ago","Yuvan from Pudukkottai joined 2 minutes ago","Ajay from Mayiladuthurai joined 1 minutes ago","Kiran from Dharmapuri joined 3 minutes ago","Roshan from Vellore joined 4 minutes ago","Vinoth from Pudukkottai joined 4 minutes ago","Bharath from Salem joined 4 minutes ago","Madan from Salem joined 1 minutes ago","Udhay from Cuddalore joined 4 minutes ago","Abirami from Tirunelveli joined 1 minutes ago","Anitha from Ramanathapuram joined 2 minutes ago","Kavitha from Dindigul joined 2 minutes ago","Divya from Chennai joined 4 minutes ago","Priya from Virudhunagar joined 2 minutes ago","Nithya from Karur joined 2 minutes ago","Swathi from Vellore joined 3 minutes ago","Revathi from Perambalur joined 4 minutes ago","Lakshmi from Virudhunagar joined 4 minutes ago","Meena from Pollachi joined 2 minutes ago","Kalai from Tirunelveli joined 4 minutes ago","Raji from Pollachi joined 2 minutes ago","Latha from Kanchipuram joined 2 minutes ago","Geetha from Chennai joined 1 minutes ago","Saranya from Coimbatore joined 1 minutes ago","Harini from Trichy joined 1 minutes ago","Janani from Ramanathapuram joined 1 minutes ago","Keerthana from Virudhunagar joined 1 minutes ago","Aarthi from Thanjavur joined 1 minutes ago","Pavithra from Dharmapuri joined 3 minutes ago","Deepa from Dindigul joined 4 minutes ago","Shalini from Perambalur joined 4 minutes ago","Suganya from Dindigul joined 3 minutes ago","Vidhya from Villupuram joined 4 minutes ago","Mahalakshmi from Kanchipuram joined 4 minutes ago","Sudha from Krishnagiri joined 2 minutes ago","Uma from Krishnagiri joined 3 minutes ago","Radha from Madurai joined 2 minutes ago","Bhavani from Hosur joined 1 minutes ago","Chitra from Thoothukudi joined 3 minutes ago","Malathi from Cuddalore joined 4 minutes ago","Sangeetha from Kanchipuram joined 3 minutes ago","Yamini from Virudhunagar joined 1 minutes ago","Rukmini from Cuddalore joined 3 minutes ago","Indira from Cuddalore joined 4 minutes ago","Jaya from Nagapattinam joined 1 minutes ago","Preethi from Perambalur joined 4 minutes ago","Nandhini from Krishnagiri joined 3 minutes ago","Vaishnavi from Dharmapuri joined 2 minutes ago","Gayathri from Thoothukudi joined 1 minutes ago","Mythili from Krishnagiri joined 2 minutes ago","Hema from Thanjavur joined 3 minutes ago","Rekha from Madurai joined 3 minutes ago","Kowsalya from Madurai joined 3 minutes ago","Vani from Pollachi joined 3 minutes ago","Nisha from Perambalur joined 1 minutes ago","Shruthi from Trichy joined 1 minutes ago","Sowmya from Ramanathapuram joined 2 minutes ago","Roja from Erode joined 4 minutes ago","Kala from Thanjavur joined 2 minutes ago","Arun from Dharmapuri joined 3 minutes ago","Karthik from Tirunelveli joined 3 minutes ago","Vijay from Villupuram joined 1 minutes ago","Suresh from Tirunelveli joined 3 minutes ago","Ramesh from Thoothukudi joined 2 minutes ago","Ganesh from Thoothukudi joined 4 minutes ago","Dinesh from Ramanathapuram joined 2 minutes ago","Prakash from Karur joined 2 minutes ago","Senthil from Thoothukudi joined 4 minutes ago","Rajesh from Mayiladuthurai joined 4 minutes ago","Kumar from Ramanathapuram joined 4 minutes ago","Mani from Pudukkottai joined 3 minutes ago","Babu from Tirunelveli joined 1 minutes ago","Mohan from Vellore joined 1 minutes ago","Saravanan from Thoothukudi joined 1 minutes ago","Naveen from Perambalur joined 3 minutes ago","Ajith from Pollachi joined 1 minutes ago","Vignesh from Thanjavur joined 4 minutes ago","Harish from Perambalur joined 1 minutes ago","Lokesh from Perambalur joined 2 minutes ago","Pradeep from Coimbatore joined 1 minutes ago","Deepak from Madurai joined 3 minutes ago","Santhosh from Tirunelveli joined 4 minutes ago","Anand from Karur joined 2 minutes ago","Raja from Madurai joined 2 minutes ago","Gopi from Perambalur joined 1 minutes ago","Selvam from Nagapattinam joined 1 minutes ago","Elango from Kanchipuram joined 1 minutes ago","Bala from Madurai joined 4 minutes ago","Kannan from Perambalur joined 1 minutes ago","Murugan from Vellore joined 1 minutes ago","Shankar from Thanjavur joined 4 minutes ago","Vasu from Thanjavur joined 3 minutes ago","Ravi from Cuddalore joined 4 minutes ago","Aravind from Nagapattinam joined 3 minutes ago","Siva from Tiruppur joined 3 minutes ago","Jegan from Virudhunagar joined 1 minutes ago","Sakthivel from Salem joined 4 minutes ago","Karthikeyan from Coimbatore joined 2 minutes ago","Nithin from Salem joined 2 minutes ago","Rahul from Tenkasi joined 1 minutes ago","Surya from Tirunelveli joined 1 minutes ago","Yuvan from Erode joined 4 minutes ago","Ajay from Ramanathapuram joined 2 minutes ago","Kiran from Ariyalur joined 3 minutes ago","Roshan from Krishnagiri joined 2 minutes ago","Vinoth from Mayiladuthurai joined 3 minutes ago","Bharath from Ariyalur joined 1 minutes ago","Madan from Pudukkottai joined 1 minutes ago","Udhay from Thanjavur joined 3 minutes ago","Abirami from Karur joined 1 minutes ago","Anitha from Pollachi joined 4 minutes ago","Kavitha from Mayiladuthurai joined 3 minutes ago","Divya from Chennai joined 1 minutes ago","Priya from Villupuram joined 3 minutes ago","Nithya from Coimbatore joined 4 minutes ago","Swathi from Tenkasi joined 1 minutes ago","Revathi from Sivakasi joined 3 minutes ago","Lakshmi from Cuddalore joined 1 minutes ago","Meena from Krishnagiri joined 1 minutes ago","Kalai from Krishnagiri joined 2 minutes ago","Raji from Hosur joined 1 minutes ago","Latha from Mayiladuthurai joined 1 minutes ago","Geetha from Tirunelveli joined 1 minutes ago","Saranya from Thanjavur joined 2 minutes ago","Harini from Coimbatore joined 2 minutes ago","Janani from Ramanathapuram joined 3 minutes ago","Keerthana from Coimbatore joined 2 minutes ago","Aarthi from Thanjavur joined 1 minutes ago","Pavithra from Virudhunagar joined 4 minutes ago","Deepa from Ariyalur joined 1 minutes ago","Shalini from Krishnagiri joined 1 minutes ago","Suganya from Thoothukudi joined 3 minutes ago","Vidhya from Erode joined 3 minutes ago","Mahalakshmi from Vellore joined 4 minutes ago","Sudha from Dharmapuri joined 1 minutes ago","Uma from Dindigul joined 3 minutes ago","Radha from Mayiladuthurai joined 4 minutes ago","Bhavani from Tiruppur joined 4 minutes ago","Chitra from Thoothukudi joined 4 minutes ago","Malathi from Cuddalore joined 4 minutes ago","Sangeetha from Salem joined 3 minutes ago","Yamini from Ariyalur joined 4 minutes ago","Rukmini from Salem joined 1 minutes ago","Indira from Karur joined 2 minutes ago","Jaya from Madurai joined 1 minutes ago","Preethi from Coimbatore joined 2 minutes ago","Nandhini from Nagapattinam joined 4 minutes ago","Vaishnavi from Vellore joined 4 minutes ago","Gayathri from Karur joined 2 minutes ago","Mythili from Chennai joined 1 minutes ago","Hema from Hosur joined 4 minutes ago","Rekha from Nagapattinam joined 3 minutes ago","Kowsalya from Dindigul joined 2 minutes ago","Vani from Krishnagiri joined 1 minutes ago","Nisha from Pudukkottai joined 3 minutes ago","Shruthi from Nagapattinam joined 1 minutes ago","Sowmya from Madurai joined 2 minutes ago","Roja from Erode joined 3 minutes ago","Kala from Tenkasi joined 4 minutes ago","Arun from Cuddalore joined 1 minutes ago","Karthik from Krishnagiri joined 2 minutes ago","Vijay from Ariyalur joined 4 minutes ago","Suresh from Dharmapuri joined 2 minutes ago","Ramesh from Kanchipuram joined 4 minutes ago","Ganesh from Nagercoil joined 4 minutes ago","Dinesh from Vellore joined 2 minutes ago","Prakash from Thoothukudi joined 1 minutes ago","Senthil from Nagercoil joined 4 minutes ago","Rajesh from Kanchipuram joined 4 minutes ago","Kumar from Karur joined 4 minutes ago","Mani from Erode joined 2 minutes ago","Babu from Thoothukudi joined 4 minutes ago","Mohan from Dharmapuri joined 2 minutes ago","Saravanan from Krishnagiri joined 1 minutes ago","Naveen from Erode joined 3 minutes ago","Ajith from Tenkasi joined 2 minutes ago","Vignesh from Karur joined 4 minutes ago","Harish from Sivakasi joined 2 minutes ago","Lokesh from Dindigul joined 4 minutes ago","Pradeep from Cuddalore joined 2 minutes ago","Deepak from Mayiladuthurai joined 3 minutes ago","Santhosh from Thoothukudi joined 2 minutes ago","Anand from Dharmapuri joined 2 minutes ago","Raja from Trichy joined 3 minutes ago","Gopi from Krishnagiri joined 3 minutes ago","Selvam from Thoothukudi joined 3 minutes ago","Elango from Salem joined 4 minutes ago","Bala from Mayiladuthurai joined 2 minutes ago","Kannan from Virudhunagar joined 3 minutes ago","Murugan from Tiruppur joined 2 minutes ago","Shankar from Madurai joined 4 minutes ago","Vasu from Thanjavur joined 3 minutes ago","Ravi from Pollachi joined 4 minutes ago","Aravind from Thoothukudi joined 4 minutes ago","Siva from Ariyalur joined 4 minutes ago","Jegan from Tiruppur joined 4 minutes ago","Sakthivel from Salem joined 4 minutes ago","Karthikeyan from Karur joined 2 minutes ago","Nithin from Sivakasi joined 4 minutes ago","Rahul from Tirunelveli joined 2 minutes ago","Surya from Pudukkottai joined 1 minutes ago","Yuvan from Tirunelveli joined 1 minutes ago","Ajay from Cuddalore joined 1 minutes ago","Kiran from Ariyalur joined 2 minutes ago","Roshan from Krishnagiri joined 1 minutes ago","Vinoth from Villupuram joined 3 minutes ago","Bharath from Tiruppur joined 2 minutes ago","Madan from Madurai joined 3 minutes ago","Udhay from Hosur joined 2 minutes ago","Abirami from Ramanathapuram joined 1 minutes ago","Anitha from Chennai joined 4 minutes ago","Kavitha from Pudukkottai joined 2 minutes ago","Divya from Tenkasi joined 3 minutes ago","Priya from Chennai joined 2 minutes ago","Nithya from Ariyalur joined 4 minutes ago","Swathi from Tenkasi joined 1 minutes ago","Revathi from Thanjavur joined 3 minutes ago","Lakshmi from Tiruppur joined 2 minutes ago","Meena from Vellore joined 3 minutes ago","Kalai from Thoothukudi joined 3 minutes ago","Raji from Tirunelveli joined 2 minutes ago","Latha from Thanjavur joined 4 minutes ago","Geetha from Sivakasi joined 3 minutes ago","Saranya from Sivakasi joined 1 minutes ago","Harini from Dindigul joined 2 minutes ago","Janani from Dindigul joined 4 minutes ago","Keerthana from Mayiladuthurai joined 4 minutes ago","Aarthi from Salem joined 2 minutes ago","Pavithra from Thanjavur joined 4 minutes ago","Deepa from Hosur joined 4 minutes ago","Shalini from Tenkasi joined 2 minutes ago","Suganya from Tirunelveli joined 2 minutes ago","Vidhya from Krishnagiri joined 1 minutes ago","Mahalakshmi from Chennai joined 3 minutes ago","Sudha from Erode joined 4 minutes ago","Uma from Mayiladuthurai joined 3 minutes ago","Radha from Sivakasi joined 1 minutes ago","Bhavani from Karur joined 1 minutes ago","Chitra from Nagapattinam joined 3 minutes ago","Malathi from Pudukkottai joined 2 minutes ago","Sangeetha from Dharmapuri joined 3 minutes ago","Yamini from Virudhunagar joined 2 minutes ago","Rukmini from Tirunelveli joined 1 minutes ago","Indira from Erode joined 4 minutes ago","Jaya from Nagapattinam joined 1 minutes ago","Preethi from Pollachi joined 1 minutes ago","Nandhini from Krishnagiri joined 2 minutes ago","Vaishnavi from Virudhunagar joined 3 minutes ago","Gayathri from Kanchipuram joined 4 minutes ago","Mythili from Trichy joined 4 minutes ago","Hema from Coimbatore joined 1 minutes ago","Rekha from Salem joined 3 minutes ago","Kowsalya from Pollachi joined 1 minutes ago","Vani from Trichy joined 3 minutes ago","Nisha from Mayiladuthurai joined 2 minutes ago","Shruthi from Pollachi joined 3 minutes ago","Sowmya from Erode joined 1 minutes ago","Roja from Karur joined 4 minutes ago","Kala from Trichy joined 4 minutes ago",
];

/* ── Phase / seats logic ──────────────────────────────────────────────── */
function getPhaseInfo(nextWebinarAt) {
  if (!nextWebinarAt) return { phase: 'almost', seatsLeft: 9 };
  const h = (new Date(nextWebinarAt).getTime() - Date.now()) / 3_600_000;
  if (h > 36) {
    // 187 → 47 seats left; we track the 36h window before the 36h mark (72h to 36h)
    const progress = Math.max(0, Math.min(1, (Math.min(h, 72) - 36) / 36));
    return { phase: 'open',    seatsLeft: Math.round(47 + progress * 140) }; // 187 → 47
  }
  if (h > 24) {
    const progress = (36 - h) / 12;
    return { phase: 'closing', seatsLeft: Math.round(47 - progress * 29) }; // 47 → 18
  }
  if (h > 12) {
    const progress = (24 - h) / 12;
    return { phase: 'filling', seatsLeft: Math.round(18 - progress * 6) };  // 18 → 12
  }
  if (h > 2) {
    const progress = (12 - h) / 10;
    return { phase: 'almost',  seatsLeft: Math.round(12 - progress * 9) };  // 12 → 3
  }
  if (h > 0) return { phase: 'last', seatsLeft: 0 };
  return { phase: 'ended', seatsLeft: 0 };
}

const PHASE_STYLES = {
  open:    { bg: 'rgba(220,252,231,0.85)', border: 'rgba(34,197,94,0.40)',   dot: '#22C55E', textMain: '#14532D', textSub: '#166534', shadow: 'rgba(34,197,94,0.10)' },
  closing: { bg: 'rgba(254,243,199,0.85)', border: 'rgba(251,191,36,0.45)',  dot: '#F59E0B', textMain: '#92400E', textSub: '#B45309', shadow: 'rgba(245,158,11,0.12)' },
  filling: { bg: 'rgba(254,243,199,0.85)', border: 'rgba(251,191,36,0.45)',  dot: '#F59E0B', textMain: '#92400E', textSub: '#B45309', shadow: 'rgba(245,158,11,0.12)' },
  almost:  { bg: 'rgba(254,243,199,0.85)', border: 'rgba(251,191,36,0.45)',  dot: '#F59E0B', textMain: '#92400E', textSub: '#B45309', shadow: 'rgba(245,158,11,0.12)' },
  last:    { bg: 'rgba(254,226,226,0.85)', border: 'rgba(248,113,113,0.45)', dot: '#EF4444', textMain: '#7F1D1D', textSub: '#991B1B', shadow: 'rgba(239,68,68,0.12)' },
  ended:   { bg: 'rgba(254,226,226,0.85)', border: 'rgba(248,113,113,0.45)', dot: '#EF4444', textMain: '#7F1D1D', textSub: '#991B1B', shadow: 'rgba(239,68,68,0.12)' },
};

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
  const nextWebinarAt = state.webinarConfig.next_webinar_at;
  const [seatsReserved, setSeatsReserved] = useState(() => {
    const { seatsLeft } = getPhaseInfo(nextWebinarAt);
    return 2000 - seatsLeft;
  });
  const [visibleMsgs, setVisibleMsgs] = useState([
    { id: 0, text: LIVE_MESSAGES[0] },
    { id: 1, text: LIVE_MESSAGES[1] },
  ]);
  const msgIdxRef = useRef(2);
  const msgKeyRef = useRef(2);
  const listControls = useAnimation();
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

  // Sync seatsReserved whenever webinar config loads or changes
  useEffect(() => {
    const { seatsLeft } = getPhaseInfo(nextWebinarAt);
    setSeatsReserved(2000 - seatsLeft);
    const id = setInterval(() => {
      const { seatsLeft } = getPhaseInfo(nextWebinarAt);
      setSeatsReserved(2000 - seatsLeft);
    }, 60000);
    return () => clearInterval(id);
  }, [nextWebinarAt]);

  useEffect(() => {
    let tid;
    let busy = false;
    async function scheduleNext() {
      const delay = 2200 + Math.random() * 1800;
      tid = setTimeout(async () => {
        if (!busy) {
          busy = true;
          const idx = msgIdxRef.current % LIVE_MESSAGES.length;
          const key = msgKeyRef.current++;
          setVisibleMsgs(prev => [...prev, { id: key, text: LIVE_MESSAGES[idx] }]);
          msgIdxRef.current++;
          await listControls.start({ y: -44, transition: { duration: 2, ease: [0.22, 1, 0.36, 1] } });
          setVisibleMsgs(prev => prev.slice(1));
          listControls.set({ y: 0 });
          busy = false;
        }
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(tid);
  }, [listControls]);

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
    background: 'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(237,234,248,0.30) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#3B0764',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(91,33,182,0.08), 0 2px 12px rgba(91,33,182,0.10)',
    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div className="flex flex-col min-h-screen pb-6">
      <div style={{ padding: '14px 16px 10px' }} />

      <div className="flex-1 px-4 flex flex-col gap-4">

        {/* Hero — image behind the card, card overlaps image bottom */}
        <motion.div {...cardAnim(1)} style={{ position: 'relative' }}>
          {/* Person image — behind card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -60, position: 'relative', zIndex: 0, pointerEvents: 'none', userSelect: 'none' }}>
            <img src="/person.webp" alt="" style={{ width: '55%', maxWidth: 200, display: 'block' }} />
          </div>
          {/* Glass card — in front, covers lower part of image, minimal top padding */}
          <div className="glass-card" style={{ paddingTop: 20, paddingBottom: 22, paddingLeft: 20, paddingRight: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(0.92rem, 4.5vw, 1.15rem)', color: '#3B0764', lineHeight: 1.18, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 10, whiteSpace: 'nowrap' }}>
              {t.screen1A.headline[lang]}
            </h1>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: 'rgba(91,33,182,0.38)', lineHeight: 1.5, fontWeight: 500 }}>
              {t.screen1A.subheadline[lang]}
            </p>
          </div>
        </motion.div>

        {/* Press Bar */}
        <motion.div {...cardAnim(2)} style={{ overflow: 'hidden', padding: '4px 0' }}>
          <div className="press-marquee-track">
            {[
              { text: 'CHENNAI TIMES', tamil: false },
              { text: 'MADURAI TIMES', tamil: false },
              { text: 'COIMBATORE TIMES', tamil: false },
              { text: 'THE TIMES OF INDIA', tamil: false },
              { text: 'இந்து தமிழ்', tamil: true },
              { text: 'CHENNAI TIMES', tamil: false },
              { text: 'MADURAI TIMES', tamil: false },
              { text: 'COIMBATORE TIMES', tamil: false },
              { text: 'THE TIMES OF INDIA', tamil: false },
              { text: 'இந்து தமிழ்', tamil: true },
            ].map((item, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 8px',
                padding: '6px 16px',
                borderRadius: 10,
                background: 'rgba(237,234,248,0.60)',
                border: '1px solid rgba(91,33,182,0.10)',
                fontFamily: item.tamil ? '"Noto Serif Tamil", Georgia, serif' : '"Georgia", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: item.tamil ? '0.88rem' : '0.78rem',
                color: '#3B0764',
                letterSpacing: item.tamil ? '0' : '0.04em',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.82)',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(91,33,182,0.08)',
              }}>
                {item.text}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div {...cardAnim(3)}><CountdownTimer /></motion.div>

        {/* Phase-aware urgency banner */}
        {(() => {
          const { phase, seatsLeft } = getPhaseInfo(nextWebinarAt);
          const s = PHASE_STYLES[phase] || PHASE_STYLES.almost;
          const bannerText = {
            open:    { en: `Live Registration Open — Only ${seatsLeft} Seats Left`,   ta: `நேரலை பதிவு திறந்துள்ளது — வெறும் ${seatsLeft} இடங்கள் மட்டுமே` },
            closing: { en: `Closing Soon — Only ${seatsLeft} Seats Left`,             ta: `விரைவில் மூடப்படும் — வெறும் ${seatsLeft} இடங்கள் மட்டுமே` },
            filling: { en: `Filling Fast — Only ${seatsLeft} Seats Left`,             ta: `விரைவாக நிரம்புகிறது — வெறும் ${seatsLeft} இடங்கள் மட்டுமே` },
            almost:  { en: `Almost Full — Only ${seatsLeft} Seats Left`,              ta: `கிட்டத்தட்ட நிரம்பியது — வெறும் ${seatsLeft} இடங்கள் மட்டுமே` },
            last:    { en: 'LAST CHANCE — Starting Soon!',                             ta: 'கடைசி வாய்ப்பு — இப்போது தொடங்குகிறது!' },
            ended:   { en: 'LAST CHANCE — Starting Soon!',                             ta: 'கடைசி வாய்ப்பு — இப்போது தொடங்குகிறது!' },
          };
          const subText = phase === 'last' || phase === 'ended'
            ? { en: 'Join now before it starts!', ta: 'தொடங்குவதற்கு முன் இப்போதே சேரவும்!' }
            : { en: 'Register now to secure your spot', ta: 'உங்கள் இடத்தை உறுதி செய்ய இப்போதே பதிவு செய்யுங்கள்' };
          return (
            <motion.div {...cardAnim(3)}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: s.bg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${s.border}`,
                borderRadius: 14,
                boxShadow: `0 2px 12px ${s.shadow}`,
                padding: '12px 14px',
              }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.3 }}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: 4, display: 'inline-block' }}
                />
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.92rem', color: s.textMain, margin: 0, lineHeight: 1.25 }}>
                    {lang === 'tamil' ? bannerText[phase].ta : bannerText[phase].en}
                  </p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', color: s.textSub, marginTop: 3 }}>
                    {lang === 'tamil' ? subText.ta : subText.en}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Seats Reserved + Live Activity — single unified card */}
        <motion.div {...cardAnim(3)}>
          <div style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.72)',
            borderRadius: 18,
            boxShadow: '0 4px 20px rgba(91,33,182,0.09)',
            overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.65rem', color: '#3B0764', lineHeight: 1 }}>
                  {seatsReserved.toLocaleString('en-IN')}
                </span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#7C3AED' }}>
                  {lang === 'tamil' ? 'இடங்கள் பதிவு' : 'Seats Reserved'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.10)', borderRadius: 50, padding: '4px 10px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }}
                />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
                  {lang === 'tamil' ? 'நேரலை' : 'Live updating'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(91,33,182,0.07)', margin: '0 16px' }} />

            {/* Message cards — container scrolls up as a whole, clipped */}
            <div style={{ height: 94, overflow: 'hidden', padding: '6px 10px', boxSizing: 'border-box' }}>
              <motion.div animate={listControls} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visibleMsgs.map(({ id, text }) => {
                  const timeMatch = text.match(/(\d+ minutes? ago)$/);
                  const timeText = timeMatch ? timeMatch[1] : '';
                  const nameText = timeMatch ? text.slice(0, -timeText.length).trim() : text;
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px',
                        height: 38,
                        flexShrink: 0,
                        gap: 8,
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: 10,
                        border: '1px solid rgba(91,33,182,0.08)',
                        boxShadow: '0 1px 6px rgba(91,33,182,0.06)',
                      }}
                    >
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#3B0764', fontWeight: 500, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nameText}
                      </span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 400, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {timeText}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── CTA section ── */}
        <motion.div className="mt-auto pt-2 pb-2" {...cardAnim(4)}>
          <motion.button
            onClick={() => { stopTick(); setExpanded(true); }}
            initial={{ scale: 1, boxShadow: '0 4px 20px rgba(91,33,182,0.45), 0 0 40px 6px rgba(91,33,182,0.18)' }}
            animate={{
              scale: [1, 1.025, 1],
              boxShadow: [
                '0 4px 20px rgba(91,33,182,0.45), 0 0 40px 6px rgba(91,33,182,0.18)',
                '0 6px 28px rgba(91,33,182,0.70), 0 0 70px 20px rgba(91,33,182,0.32)',
                '0 4px 20px rgba(91,33,182,0.45), 0 0 40px 6px rgba(91,33,182,0.18)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            style={{
              width: '100%', height: '3.5rem',
              background: '#5B21B6',
              border: 'none', borderRadius: 50,
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1.1rem',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {t.screen1A.cta[lang]}
          </motion.button>


          <TrustBar />
        </motion.div>

        {/* ── Blur backdrop ── */}
        <AnimatePresence>
          {expanded && (
            <>
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
              <motion.div
                key="floating-timer"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{
                  position: 'fixed', top: '16%', left: 16, right: 16,
                  display: 'flex', justifyContent: 'center',
                  zIndex: 55, pointerEvents: 'none',
                }}
              >
                <CountdownTimer floating />
              </motion.div>
            </>
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
                      style={{ width: '38%', maxWidth: 140, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
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
                      style={{ width: '38%', maxWidth: 140, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.30))' }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* ── Card ── */}
              <div style={{
                background: 'rgba(255,255,255,0.82)',
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
                      <div style={{ marginBottom: 14 }}>
                        <p style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700, fontSize: '1.45rem',
                          color: '#3B0764', margin: 0,
                        }}>
                          {lang === 'tamil' ? 'உங்கள் சர்க்கரை அளவு?' : 'your sugar level?'}
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
                            {lang === 'tamil' ? opt.labelTa : opt.labelEn}
                          </motion.button>
                        ))}
                      </div>

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
