import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';

const SHARE_URL = window.location.origin;
const SHARE_MESSAGE = 'சர்க்கரை நோயை தலைகீழாக மாற்றலாம்! இந்த இலவச வெபினாரில் சேருங்கள்: ';

export default function Disqualified() {
  const { state } = useFunnel();
  const lang = state.lang;
  const [copied, setCopied] = useState(false);

  function shareWA() {
    window.open('https://wa.me/?text=' + encodeURIComponent(SHARE_MESSAGE + SHARE_URL), '_blank');
  }
  function shareSMS() {
    window.open('sms:?body=' + encodeURIComponent(SHARE_MESSAGE + SHARE_URL));
  }
  function copyLink() {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col min-h-screen pb-8"
    >
      <div className="flex-1 px-4 flex flex-col items-center gap-5 pt-10">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.75)',
            borderRadius: 20,
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(91,33,182,0.10)',
          }}
        >
          <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 900, fontSize: '1.4rem', color: '#3B0764', lineHeight: 1.25, marginBottom: 10 }}>
            {t.disqualified.headline[lang]}
          </h2>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', color: 'rgba(91,33,182,0.60)', lineHeight: 1.6 }}>
            {t.disqualified.subheadline[lang]}
          </p>
        </motion.div>

        {/* Share label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: 'rgba(91,33,182,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {lang === 'tamil' ? 'நண்பர்களுடன் பகிரவும்' : 'Share with friends'}
        </motion.p>

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* WhatsApp share */}
          <motion.button
            onClick={shareWA}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: '3.4rem',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              border: 'none', borderRadius: 14,
              color: '#fff', fontFamily: '"Montserrat", sans-serif',
              fontWeight: 800, fontSize: '0.98rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              boxShadow: '0 4px 18px rgba(37,211,102,0.35)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t.disqualified.shareWA[lang]}
          </motion.button>

          {/* SMS share */}
          <motion.button
            onClick={shareSMS}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: '3.4rem',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              border: 'none', borderRadius: 14,
              color: '#fff', fontFamily: '"Montserrat", sans-serif',
              fontWeight: 800, fontSize: '0.98rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              boxShadow: '0 4px 18px rgba(91,33,182,0.35)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            {t.disqualified.shareSMS[lang]}
          </motion.button>

          {/* Copy link */}
          <motion.button
            onClick={copyLink}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: '3.4rem',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(91,33,182,0.20)',
              borderRadius: 14,
              color: '#5B21B6', fontFamily: '"Montserrat", sans-serif',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)',
            }}
          >
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: '#16A34A' }}>{t.disqualified.copied[lang]}</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                {t.disqualified.copyLink[lang]}
              </>
            )}
          </motion.button>

        </div>
      </div>
    </motion.div>
  );
}
