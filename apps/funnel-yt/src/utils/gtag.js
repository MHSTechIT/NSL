// Google Ads gtag wrappers — YT pipeline only.
// The base script (gtag.js + gtag('config', AW-17164057977)) lives in
// index.html. Functions below send specific conversion events to Google Ads.
// Each function is a safe no-op when window.gtag isn't loaded yet (e.g.
// before the async gtag.js script finishes downloading).

const send = (...args) => typeof window !== 'undefined' && window.gtag && window.gtag(...args);

// LPV — landing page view conversion. Fire once on the funnel landing page.
export const gtagPageView = () =>
  send('event', 'conversion', { send_to: 'AW-17164057977/4yTLCLyo_6kcEPn6uvg_' });

// Lead — fired after a lead is captured (POST /api/leads returns success).
export const gtagLead = () =>
  send('event', 'conversion', { send_to: 'AW-17164057977/aYa6COGX_6kcEPn6uvg_' });

// ATC — fired when a user clicks the main CTA, signalling intent to convert.
// Returns a Promise that resolves once gtag's callback fires (or after a 1s
// safety timeout) so callers can defer navigation until the event is sent.
export function gtagAddToCart() {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.gtag) { resolve(); return; }
    const safety = setTimeout(resolve, 1000);
    window.gtag('event', 'conversion', {
      send_to: 'AW-17164057977/zuqgCMzKmKocEPn6uvg_',
      event_callback: () => { clearTimeout(safety); resolve(); },
    });
  });
}
