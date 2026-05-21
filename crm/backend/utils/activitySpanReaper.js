/* Stale activity-span reaper.
   ===================================================================
   The single-tag model keeps exactly ONE open activity span per caller.
   When a caller closes their browser / crashes / drops offline, that
   span is never closed by a heartbeat and would otherwise tick forever
   (the old "30h on call" bug).

   This watchdog runs every `intervalMs` and closes any open span whose
   caller has not sent a heartbeat within `staleAfterMs`. The close is
   back-dated to `last_heartbeat_at` so the recorded duration reflects
   when the caller was actually last seen — not when the reaper fired.
   A LOGGED_OUT point event is logged for each reaped caller.
   =================================================================== */
const pool = require('../db');
const activityLogger = require('./activityLogger');

const DEFAULT_INTERVAL_MS    = 60 * 1000;   // 60 s
const DEFAULT_STALE_AFTER_MS = 90 * 1000;   // 90 s — 3 missed 30 s heartbeats

let _timer = null;

async function reapOnce(staleAfterMs) {
  const cutoffSec = Math.ceil(staleAfterMs / 1000);
  try {
    const { rows } = await pool.query(
      `UPDATE caller_activity_events e
          SET ended_at     = COALESCE(u.last_heartbeat_at, e.started_at),
              duration_sec = GREATEST(0, EXTRACT(EPOCH FROM
                               (COALESCE(u.last_heartbeat_at, e.started_at) - e.started_at))::int),
              context      = COALESCE(e.context, '{}'::jsonb)
                               || jsonb_build_object('closed_by', 'activity_span_reaper')
         FROM crm_users u
        WHERE e.caller_id = u.id
          AND e.ended_at IS NULL
          AND (u.last_heartbeat_at IS NULL
               OR u.last_heartbeat_at < NOW() - ($1 || ' seconds')::interval)
        RETURNING e.caller_id`,
      [String(cutoffSec)]
    );
    for (const r of rows) {
      try { await activityLogger.logPointEvent(r.caller_id, 'LOGGED_OUT'); } catch (_) { /* best-effort */ }
    }
    if (rows.length > 0) {
      console.log(JSON.stringify({
        type:            'activity_spans_reaped',
        count:           rows.length,
        stale_after_sec: cutoffSec,
        at:              new Date().toISOString(),
      }));
    }
    return rows.length;
  } catch (err) {
    console.error('[activitySpanReaper] reap error:', err.message);
    return 0;
  }
}

function startActivitySpanReaper({
  intervalMs   = DEFAULT_INTERVAL_MS,
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
} = {}) {
  if (_timer) return;
  console.log(`[activitySpanReaper] scheduler started — every ${Math.round(intervalMs/1000)}s, stale ≥ ${Math.round(staleAfterMs/1000)}s`);
  _timer = setInterval(() => { reapOnce(staleAfterMs); }, intervalMs);
  // Fire once shortly after boot to clear spans orphaned by a restart.
  setTimeout(() => reapOnce(staleAfterMs), 7000);
}

function stopActivitySpanReaper() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startActivitySpanReaper, stopActivitySpanReaper, reapOnce };
