import { useEffect, useRef, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
   useRobotNudge — the repeat-nudge engine behind the robot guide.

   While `active` is true it ticks: `count` is how many `intervalMs` windows
   have elapsed (0 immediately, 1 after 30 s, 2 after 60 s …). The consuming
   component re-shows a robot nudge bubble each time `count` bumps.

   After `maxRepeats` windows it fires `onExhausted` exactly once — the
   caller uses that to auto-pause the account / caller page.

   The clock is DEADLINE-ANCHORED to a start timestamp persisted in
   `localStorage[storageKey]`, so a page refresh or a throttled background
   tab resumes the count from real elapsed time instead of restarting.
   When `active` flips false the count + storage are cleared.
   ────────────────────────────────────────────────────────────────────────── */
export default function useRobotNudge({
  active,
  intervalMs  = 30000,
  maxRepeats  = 5,
  onExhausted,
  storageKey,
}) {
  const [count, setCount]   = useState(0);
  const exhaustedRef        = useRef(false);
  const onExhaustedRef      = useRef(onExhausted);
  onExhaustedRef.current    = onExhausted;

  useEffect(() => {
    if (!active) {
      exhaustedRef.current = false;
      setCount(0);
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch (_) {} }
      return undefined;
    }

    // Restore (or stamp) the nudge start time so refreshes resume mid-count.
    let start = null;
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) start = parseInt(raw, 10) || null;
      } catch (_) { /* ignore */ }
    }
    if (!start) {
      start = Date.now();
      if (storageKey) { try { localStorage.setItem(storageKey, String(start)); } catch (_) {} }
    }

    const tick = () => {
      const n = Math.floor((Date.now() - start) / intervalMs);
      setCount(n);
      if (n >= maxRepeats && !exhaustedRef.current) {
        exhaustedRef.current = true;
        const fn = onExhaustedRef.current;
        if (typeof fn === 'function') fn();
      }
    };
    tick();                              // evaluate immediately on (re)activation
    const id = setInterval(tick, 1000);  // 1 s resolution — cheap, smooth enough
    return () => clearInterval(id);
  }, [active, intervalMs, maxRepeats, storageKey]);

  return { count };
}
