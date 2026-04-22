import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunnel } from '../context/FunnelContext';
import { t } from '../translations';
import LanguageToggle from '../components/LanguageToggle';

const slideIn = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const SHARE_URL = window.location.origin;

export default function LanguageDisqualified() {
  const { state } = useFunnel();
  const lang = state.lang;
  const [copied, setCopied] = useState(false);

  function shareWA() {
    window.open('https://wa.me/?text=' + encodeURIComponent('Check out this diabetes reversal webinar: ' + SHARE_URL), '_blank');
  }
  function copyLink() {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div variants={slideIn} initial="initial" animate="animate" exit="exit" className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex flex-col">
          <span className="font-heading font-bold text-purple text-2xl leading-tight">MHS</span>
          <span className="font-sans text-[10px] text-purple-400 tracking-widest uppercase">My Health School</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="flex-1 px-4 pb-8 flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-4xl mt-4"
        >
          🌐
        </motion.div>

        <div className="glass-card px-5 py-5 w-full">
          <h2 className="font-heading text-2xl font-bold text-purple-900 mb-2">
            {t.languageDisqualified.headline[lang]}
          </h2>
          <p className="font-sans text-sm text-purple-600 leading-relaxed">
            {t.languageDisqualified.subheadline[lang]}
          </p>
        </div>

        <div className="w-full space-y-3 mt-4">
          <button onClick={shareWA} className="btn-wa">
            💬 {t.languageDisqualified.shareWA[lang]}
          </button>
          <button onClick={copyLink} className="btn-secondary">
            {copied ? t.languageDisqualified.copied[lang] : `🔗 ${t.languageDisqualified.copyLink[lang]}`}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
