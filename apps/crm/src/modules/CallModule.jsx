import { useEffect } from 'react';
import ParticleSphere from '../components/ParticleSphere';

/* Call page — landing page for the caller.
   Renders a big, centered animation in the background and a single glowing
   circular "Start Auto Call" button on top. Clicking the button delegates
   to the CallerShell's `onStartAutoCall` handler which navigates to the
   Assigned tab and immediately kicks off the auto-call sequence.

   The page is intentionally non-scrollable — the layout is sized to fit
   any viewport. Body overflow is locked while this module is mounted and
   restored on unmount (i.e. when the caller switches to another tab). */
export default function CallModule({ onStartAutoCall }) {
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        // Fit whatever vertical space the shell gives us, never overflow.
        height: 'calc(100vh - 110px)',
        overflow: 'hidden',
      }}
    >
      {/* 3-D particle-sphere backdrop — replaces the previous orbital-line
         Lottie. Sized to the same compact square centered on the button so
         the sphere wraps the CTA rather than bleed across the page. The
         <ParticleSphere> component spins lazily and breathes via shader
         noise; additive blending makes overlapping dots glow against the
         lavender backdrop. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width:  'min(520px, 70vw, 80vh)',
          height: 'min(520px, 70vw, 80vh)',
          pointerEvents: 'none',
        }}
      >
        <ParticleSphere size="100%" />
      </div>

      {/* Foreground — phone icon embedded into the particle sphere.
         No backdrop chrome; the icon's stroke colour and glow are tuned
         to feel like a luminous element living inside the cloud, not
         pasted on top. `mix-blend-mode: screen` lets the icon brighten
         whatever colour the particles happen to be behind it, so it
         visually fuses with the sphere instead of fighting it. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <style>{`
          @keyframes callIconFloat {
            0%   { transform: translateY(0)    scale(1); }
            50%  { transform: translateY(-6px) scale(1.03); }
            100% { transform: translateY(0)    scale(1); }
          }
        `}</style>

        <button
          type="button"
          onClick={() => { if (typeof onStartAutoCall === 'function') onStartAutoCall(); }}
          aria-label="Start auto call"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Light-lavender stroke matches the brightest tier of the
            // sphere's purple ramp so the icon reads as "the same family"
            // as the particles around it.
            color: '#E9E0FF',
            animation: 'callIconFloat 3.6s ease-in-out infinite',
            transition: 'transform 180ms ease',
            // Twin purple drop-shadows simulate the icon emitting light
            // INTO the cloud — tight inner glow + softer outer bloom.
            filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.85)) drop-shadow(0 0 28px rgba(139,92,246,0.55))',
            // Screen blend = additive lightening over whatever's behind.
            // The icon brightens the particles where it overlaps instead
            // of replacing them, which reads as embedded / glassy.
            mixBlendMode: 'screen',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        >
          {/* Phone icon — stroke-only outline, light-lavender stroke */}
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
