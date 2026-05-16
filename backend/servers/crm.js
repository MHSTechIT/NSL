/**
 * CRM service entry.
 *
 * Owns:
 *   - All admin / auth / caller / calls / recordings / webhooks routes.
 *   - All schema migrations (re-uses the auto-migration block in app.js).
 *   - All cron schedulers (linkSwap, tataInbound, leadsAlert, sheetsSync,
 *     staleCallReaper, dailyReconciliation).
 *   - The 'lead.created' LISTEN handler that drives lead → caller assignment
 *     when the funnel services fire pg_notify.
 *   - The startup sweep that catches any leads that arrived while CRM was
 *     offline (NOTIFY is not durable).
 *
 * funnel-meta and funnel-yt do NOT require this file. They build their own
 * minimal Express app in servers/funnel-{meta,yt}.js so a bug in CRM code
 * paths can't crash funnel registrations.
 *
 * Default port: 3003. Override via PORT env. The legacy single-process
 * entry (index.js, port 3001) also continues to work — it requires app.js
 * and starts the same schedulers, so dev workflows are unchanged.
 */
require('dotenv').config();

const { installCrashGuards } = require('./_shared');
installCrashGuards('crm');

// app.js owns the full Express app + all middleware + all route mounts +
// runs every auto-migration as a side effect of require(). The funnel
// services intentionally do NOT import this — they build their own minimal
// app. CRM gets everything for free.
const app = require('../app');

const cron = require('node-cron');
const { startLinkSwapScheduler }               = require('../utils/linkSwapScheduler');
const { syncLeadsToSheet }                      = require('../utils/leadsSheetSync');
const { startScheduler: startTataInboundSync }  = require('../utils/tataInboundSync');
const { startScheduler: startLeadsAlert }       = require('../utils/leadsAlertScheduler');
const { startStaleCallReaper }                  = require('../utils/staleCallReaper');
const { startDailyReconciliation }              = require('../utils/dailyReconciliation');

const { startListener }                         = require('../utils/pgListener');
const { handleLeadCreated, sweepUnassignedLeads } = require('../utils/leadCreatedListener');

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`[crm] running on port ${PORT}`);

  // All schedulers — race-prone if run in more than one process, so CRM owns
  // every one and the funnel services start none.
  startLinkSwapScheduler();
  startTataInboundSync({ intervalMs: 2 * 60 * 1000 });
  startLeadsAlert({ intervalMs: 5 * 60 * 1000 });
  cron.schedule('25 18 * * *', () => {
    console.log('[Sheets Sync] Starting daily sync...');
    syncLeadsToSheet();
  });
  console.log('[Sheets Sync] Daily sync scheduled at 11:55 PM IST');
  startStaleCallReaper();
  startDailyReconciliation();

  // Cross-service signal: funnel-meta / funnel-yt fire pg_notify('lead.created')
  // after each lead INSERT. We LISTEN and run the round-robin assigner.
  startListener({
    'lead.created': handleLeadCreated,
  });

  // Recovery sweep: NOTIFY is fire-and-forget. If CRM was offline when funnels
  // fired, those leads sit with assigned_user_id = NULL. Catch them on boot.
  sweepUnassignedLeads().catch(e => console.error('[crm] sweep failed:', e.message));
});
