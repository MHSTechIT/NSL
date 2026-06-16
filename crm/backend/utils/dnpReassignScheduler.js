/*
 * dnpReassignScheduler — auto-reopen DNP (Not Picked) leads back to Assigned.
 *
 * Three times a day — 11:00, 13:00, 16:00 IST, Monday–Saturday (NOT Sunday) —
 * every lead sitting in a caller's "Not Picked" bucket (last_note_outcome
 * 'not_picked' or 'auto_paused') is reopened into that caller's Assigned page,
 * so the caller retries the unreached customers. The lead stays with the SAME
 * caller (assigned_user_id is untouched); we just clear the closing-state and
 * re-stamp assigned_at/pinned_at — exactly what the manual
 * POST /api/caller/leads/reopen { source:'dnp' } does, but for every caller on
 * a schedule.
 *
 * Applies to both the Meta-family `leads` table and the NSM `nsm_leads` table.
 * Owned by the CRM service and gated by DISABLE_SCHEDULERS, so it never runs in
 * dev or in a second process.
 */

const pool = require('../db');
const cron = require('node-cron');

/* Tables that hold caller leads, each with its own "current batch" restriction
   so ONLY the current batch's DNP leads are reopened (not old campaigns):
     leads     → the active webinar(s)  (one per source)
     nsm_leads → the most recent NSM batch */
const LEAD_TABLES = [
  { table: 'leads',     currentBatch: 'AND webinar_id IN (SELECT id FROM webinars WHERE is_active = TRUE)' },
  { table: 'nsm_leads', currentBatch: 'AND batch_id = (SELECT id FROM nsm_batches ORDER BY start_at DESC NULLS LAST LIMIT 1)' },
];

/* Reopen the CURRENT BATCH's DNP leads → Assigned, for every caller. Mirrors the
   manual reopen UPDATE (caller.js POST /leads/reopen, source 'dnp') minus the
   single-caller filter, plus the current-batch restriction. */
async function reopenDnpAll() {
  let total = 0;
  for (const { table, currentBatch } of LEAD_TABLES) {
    try {
      const r = await pool.query(
        `UPDATE ${table}
            SET last_note_outcome        = NULL,
                last_note_interested     = NULL,
                last_note_outcome_subtag = NULL,
                last_note_at             = NULL,
                follow_up_at             = NULL,
                completed_at             = NULL,
                assigned_at              = NOW(),
                pinned_at                = NOW(),
                lead_tag                 = NULL
          WHERE assigned_user_id IS NOT NULL
            AND last_note_outcome IN ('not_picked', 'auto_paused')
            ${currentBatch}`
      );
      total += r.rowCount;
      if (r.rowCount > 0) console.log(`[dnpReassign] ${table}: reopened ${r.rowCount} current-batch DNP lead(s) → Assigned`);
    } catch (e) {
      // nsm_leads may not exist in some deployments — log and continue.
      console.error(`[dnpReassign] ${table} skip/error:`, e.message);
    }
  }
  return total;
}

let _task = null;

function startScheduler() {
  stopScheduler();
  // minute 0, hours 11/13/16, every month, days-of-week 1–6 (Mon–Sat; 0 = Sunday,
  // excluded). Times are IST via the timezone option.
  _task = cron.schedule(
    '0 11,13,16 * * 1-6',
    () => {
      console.log('[dnpReassign] scheduled run (11:00/13:00/16:00 IST, Mon–Sat)');
      reopenDnpAll().catch(e => console.error('[dnpReassign] run error:', e.message));
    },
    { timezone: 'Asia/Kolkata' }
  );
  console.log('[dnpReassign] scheduler started — 11:00/13:00/16:00 IST, Mon–Sat (skips Sunday)');
}

function stopScheduler() {
  if (_task) { _task.stop(); _task = null; }
}

module.exports = { startScheduler, stopScheduler, reopenDnpAll };
