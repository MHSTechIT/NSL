import { AnimatePresence, motion } from 'framer-motion';

/* ─── Single morphing digit ─── */
function MorphDigit({ value, size = 'lg', urgent = false }) {
  const isLg = size === 'lg';
  const W  = isLg ? 38 : 28;
  const H  = isLg ? 50 : 36;
  const fs = isLg ? '1.65rem' : '1.05rem';
  const r  = isLg ? 10 : 7;

  return (
    <div style={{
      width: W, height: H,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: urgent
        ? 'linear-gradient(160deg, rgba(255,255,255,0.60) 0%, rgba(254,226,226,0.40) 100%)'
        : 'linear-gradient(160deg, rgba(255,255,255,0.60) 0%, rgba(237,234,248,0.35) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: r,
      border: urgent ? '1px solid rgba(255,255,255,0.72)' : '1px solid rgba(255,255,255,0.72)',
      boxShadow: urgent
        ? 'inset 0 1.5px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(239,68,68,0.10), inset 0 0 12px rgba(239,68,68,0.12)'
        : 'inset 0 1.5px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(91,33,182,0.08), inset 0 0 10px rgba(91,33,182,0.07)',
      overflow: 'hidden',
      transition: 'all 0.5s',
    }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.45, y: -6 }}
          animate={{ opacity: 1, filter: 'blur(0px)',  scale: 1,    y:  0 }}
          exit={{    opacity: 0, filter: 'blur(10px)', scale: 0.60, y:  6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: '"Outfit", "Noto Sans Tamil", sans-serif',
            fontWeight: 800,
            fontSize: fs,
            color: urgent ? '#991B1B' : '#3B0764',
            lineHeight: 1,
            userSelect: 'none',
            letterSpacing: '-0.02em',
            position: 'absolute',
            zIndex: 1,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ─── Two-or-three-digit unit with label ─── */
export function FlipUnit({ value, label, size = 'lg', urgent = false }) {
  const digits = value >= 100 ? 3 : 2;
  const str = String(value).padStart(digits, '0');
  const gap = size === 'lg' ? 3 : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap }}>
        {str.split('').map((d, i) => (
          <MorphDigit key={i} value={d} size={size} urgent={urgent} />
        ))}
      </div>

      {label && (
        <span style={{
          fontFamily: 'Outfit, "Noto Sans Tamil", sans-serif',
          fontSize: 9, fontWeight: 600,
          color: urgent ? 'rgba(153,27,27,0.70)' : 'rgba(91,33,182,0.55)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/* Alias so existing imports still work */
export { MorphDigit as FlipDigit };
