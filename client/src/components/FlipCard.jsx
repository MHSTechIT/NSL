import { AnimatePresence, motion } from 'framer-motion';

/* ─── Single morphing digit ─── */
function MorphDigit({ value, size = 'lg' }) {
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
      background: 'rgba(255,255,255,0.60)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: r,
      border: '1px solid rgba(255,255,255,0.75)',
      boxShadow: '0 2px 10px rgba(91,33,182,0.10)',
      overflow: 'hidden',
    }}>
      {/* subtle centre line */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '50%', height: 1,
        background: 'rgba(91,33,182,0.08)',
        pointerEvents: 'none', zIndex: 0,
      }} />

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
            color: '#3B0764',
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

/* ─── Two-digit unit with label ─── */
export function FlipUnit({ value, label, size = 'lg' }) {
  const str = String(value).padStart(2, '0');
  const gap = size === 'lg' ? 3 : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap }}>
        <MorphDigit value={str[0]} size={size} />
        <MorphDigit value={str[1]} size={size} />
      </div>

      {label && (
        <span style={{
          fontFamily: 'Outfit, "Noto Sans Tamil", sans-serif',
          fontSize: 9, fontWeight: 600,
          color: 'rgba(91,33,182,0.55)',
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
