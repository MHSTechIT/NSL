/* schedulerManager.js — single point that (re)starts the CALLER-facing
   backend watchdogs from a merged timer-settings object.

   Called on boot (from servers/crm.js) and live on every successful
   PUT /api/admin/timer-settings, so changing an interval on the caller
   Timer Settings page takes effect immediately without a redeploy.

   The 3 schedulers it owns — all serve caller pages:
     activitySpanReaper  — caller online / offline detection
     staleCallReaper     — recovers a caller's stuck auto-call
     tataInboundSync     — feeds the caller's Missed Calls page

   leadsAlert + linkSwap are funnel/marketing schedulers (WhatsApp link
   swaps, deadline alerts) — they are deliberately NOT managed here and are
   NOT on the caller Timer Settings page. servers/crm.js starts them
   directly on fixed intervals.

   Each scheduler is stopped then started fresh with the new intervals; the
   stop calls are harmless no-ops on the first (boot) call. When
   DISABLE_SCHEDULERS=true the whole thing no-ops — so the shared-DB safety
   flag is respected both on boot and on every live update. */

const { startActivitySpanReaper, stopActivitySpanReaper } = require('./activitySpanReaper');
const { startStaleCallReaper,  stopStaleCallReaper }      = require('./staleCallReaper');
const tataInboundSync                                     = require('./tataInboundSync');

function applyTimerSettings(settings = {}) {
  if (process.env.DISABLE_SCHEDULERS === 'true') {
    console.log('[schedulerManager] DISABLE_SCHEDULERS=true → not starting any scheduler');
    return;
  }

  // activitySpanReaper
  stopActivitySpanReaper();
  startActivitySpanReaper({
    intervalMs:   settings.activityReaperIntervalMs,
    staleAfterMs: settings.activityStaleAfterMs,
  });
  console.log(`[schedulerManager] activitySpanReaper (re)started — interval ${settings.activityReaperIntervalMs}ms, stale ${settings.activityStaleAfterMs}ms`);

  // staleCallReaper
  stopStaleCallReaper();
  startStaleCallReaper({
    intervalMs:   settings.staleCallReaperIntervalMs,
    staleAfterMs: settings.staleCallStaleAfterMs,
  });
  console.log(`[schedulerManager] staleCallReaper (re)started — interval ${settings.staleCallReaperIntervalMs}ms, stale ${settings.staleCallStaleAfterMs}ms`);

  // tataInboundSync
  tataInboundSync.stopScheduler();
  tataInboundSync.startScheduler({ intervalMs: settings.tataInboundSyncIntervalMs });
  console.log(`[schedulerManager] tataInboundSync (re)started — interval ${settings.tataInboundSyncIntervalMs}ms`);
}

module.exports = { applyTimerSettings };
