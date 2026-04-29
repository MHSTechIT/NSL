import { m } from 'framer-motion';

const slideIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};

const PRODUCTS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfFkRVY__WZgzQd219vO9rPMA5nc5d3TwKuBAwlQsMHgcN8MA/viewform';

export default function NotTamil() {
  return (
    <m.div
      variants={slideIn} initial="initial" animate="animate" exit="exit"
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      {/* Main card */}
      <m.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.1 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.60)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(139,92,246,0.18)',
          borderRadius: 24,
          padding: '36px 28px 40px',
          boxShadow: '0 8px 40px rgba(91,33,182,0.12), inset 0 1px 0 rgba(255,255,255,0.85)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.2 }}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 6px 28px rgba(124,58,237,0.30)',
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </m.div>

        {/* Heading */}
        <h2 style={{
          fontFamily: '"Montserrat", Outfit, sans-serif',
          fontWeight: 900, fontSize: '1.45rem',
          color: '#2d0a6e', lineHeight: 1.2, marginBottom: 14,
        }}>
          This webinar is{' '}
          <span style={{
            background: 'linear-gradient(90deg, #dc2626, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            not for you.
          </span>
        </h2>

        {/* Divider */}
        <div style={{ width: 48, height: 3, borderRadius: 2, background: 'linear-gradient(90deg,#7C3AED,#a78bfa)', margin: '0 auto 18px' }} />

        {/* Subheading */}
        <p style={{
          fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem',
          color: '#5b3fa0', lineHeight: 1.65, marginBottom: 28, fontWeight: 500,
        }}>
          Explore our healthy products designed for your overall well-being.
        </p>

        {/* Product highlights */}
        {['🌿 Natural Health Products', '💪 Boost Your Immunity', '✨ Designed for Your Well-being'].map((item, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(139,92,246,0.07)', borderRadius: 10,
              padding: '8px 12px', marginBottom: 8, textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#4c1d95', fontWeight: 500 }}>{item}</span>
          </m.div>
        ))}

        {/* Our Products button */}
        <m.a
          href={PRODUCTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          animate={{
            boxShadow: [
              '0 4px 18px rgba(124,58,237,0.25)',
              '0 6px 30px rgba(124,58,237,0.50)',
              '0 4px 18px rgba(124,58,237,0.25)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', height: '3.4rem', borderRadius: 50, marginTop: 22,
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            color: '#ffffff', fontFamily: 'Outfit, sans-serif',
            fontWeight: 700, fontSize: '1.05rem',
            textDecoration: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Our Products
        </m.a>
      </m.div>
    </m.div>
  );
}
