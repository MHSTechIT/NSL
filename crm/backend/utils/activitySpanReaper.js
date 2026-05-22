/* Stale activity-span reaper.
   ===================================================================
   The single-tag model keeps exactly ONE open activity span per caller.
   When a caller closes their browser / crashes / drops offline, that
   span is never closed by a heartbeat and would otherwise tick forever.

   This watchdog runs every `intervalMs` and, for any caller who has not
   sent a heartbeat within `staleAfterMs`:
     1. Closes the open span, back-dated to `last_heartbeat_at`.
     2. Logs a LOGGED_OUT point event.
     3. If the caller dropped while working a lead they had ALREADY
        called (span tag ON_CALL / IN_FORM / REASON_CARD + a calls row),
        marks that lead `last_note_outcome = 'incomplete'` so it moves to
        the Completed Leads page for admin review.
   =================================================================== */
const pool = require('../db');
const activityLogger = require('./activityLogger');

const DEFAULT_INTERVAL_MS    = 60 * 1000;   // 60 s
const DEFAULT_STALE_AFTER_MS = 90 * 1000;   // 90 s — 3 missed 30 s heartbeats

// Span tags that mean "the caller was actively working a specific lead".
const LEAD_WORK_TAGS = ['ON_CALL', 'IN_FORM', 'REASON_CARD'];

let _timer = null;

async function reapOnce(staleAfterMs) {
  const cutoffSec = Math.ceil(staleAfterMs / 1000);
  try {
    // Stale = an open span whose caller hasn't heartbeated within the cutoff.
    const { rows: stale } = await pool.query(
      `SELECT e.id, e.caller_id, e.tag, e.context, e.started_at, u.last_heartbeat_at
         FROM caller_activity_events e
         JOIN crm_users u ON u.id = e.caller_id
        WHERE e.ended_at IS NULL
          AND (u.last_heartbeat_at IS NULL
               OR u.last_heartbeat_at < NOW() - ($1 || ' seconds')::interval)`,
      [String(cutoffSec)]
    );
    if (stale.length === 0) return 0;

    let incompleteMarked = 0;
    for (const s of stale) {
      // 1. Close the span, back-dated to the last heartbeat (accurate duration).
      try {
        await pool.query(
          `UPDATE caller_activity_events
              SET ended_at     = COALESCE($2::timestamptz, started_at),
                  duration_sec = GREATEST(0, EXTRACT(EPOCH FROM
                                   (COALESCE($2::timestamptz, started_at) - started_at))::int),
                  context      = COALESCE(context, '{}'::jsonb)
                                   || jsonb_build_object('closed_by', 'activity_span_reaper')
            WHERE id = $1`,
          [s.id, s.last_heartbeat_at]
        );
      } catch (e) { console.error('[activitySpanReaper] close span error:', e.message); }

      // 2. If the caller dropped mid-lead AND a call was actually placed on
      //    that lead, mark it Incomplete — it leaves Assigned and shows on
      //    Completed Leads for the admin to review. Never overrides a real
      //    outcome (only acts when last_note_outcome IS NULL).
      const leadId = s.context && s.context.lead_id;
      if (leadId && LEAD_WORK_TAGS.includes(s.tag)) {
        try {
          const { rows: marked } = await pool.query(
            `UPDATE leads l
                SET last_note_outcome = 'incomplete',
                    last_note_at      = NOW(),
                    completed_at      = NOW()
              WHERE l.id = $1
                AND l.last_note_outcome IS NULL
                AND EXISTS (SELECT 1 FROM calls c
                             WHERE c.lead_id = l.id AND c.caller_id = $2)
              RETURNING id`,
            [leadId, s.caller_id]
          );
          if (marked.length > 0) {
            incompleteMarked++;
            console.log(JSON.stringify({
              type:      'lead.incomplete_on_disconnect',
              lead_id:   leadId,
              caller_id: s.caller_id,
              span_tag:  s.tag,
              at:        new Date().toISOString(),
            }));
          }
        } catch (e) { console.error('[activitySpanReaper] mark-incomplete error:', e.message); }
      }

      // 3. Mark the caller logged out.
      try { await activityLogger.logPointEvent(s.caller_id, 'LOGGED_OUT'); } catch (_) { /* best-effort */ }
    }

    console.log(JSON.stringify({
      type:               'activity_spans_reaped',
      count:              stale.length,
      incomplete_marked:  incompleteMarked,
      stale_after_sec:    cutoffSec,
      at:                 new Date().toISOString(),
    }));
    return stale.length;
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
