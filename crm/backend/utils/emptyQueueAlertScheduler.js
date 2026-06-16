/*
 * emptyQueueAlertScheduler — delayed manager alert for empty caller queues.
 *
 * Every minute it checks which active callers have ZERO leads on their
 * Assigned page (the exact "No leads in your queue" predicate the caller
 * sees, mirroring GET /api/admin/empty-queue-callers). A caller's empty
 * streak is tracked in caller_empty_queue_alert(caller_id, empty_since,
 * alerted_at). When a streak reaches the admin-configured delay
 * (mgrEmptyLeadsAlertDelayMs on the TL & Assistant Timer sub-page, default
 * 10 min), the MANAGER gets a Telegram alert — once per streak. When the
 * caller's queue refills, the row is cleared so the next empty streak can
 * alert again.
 *
 * The TL/assistant already see the empty state immediately on the
 * Notifications page; this scheduler adds only the time-delayed manager push.
 *
 * Owned by the CRM service and gated by DISABLE_SCHEDULERS like every other
 * scheduler, so it never runs in dev or in a second process.
 */

const pool = require('../db');
const { mergeTimerSettings } = require('./timerDefaults');
const { notifyEmptyQueue } = require('./telegramNotifier');

let _timer = null;

/* Top-2 recent webinars per source — identical to routes/admin.js so the
   empty predicate matches the caller-side Assigned bucket exactly. */
const RECENT_WEBINARS_SQL = `(
  SELECT ranked.id FROM (
    SELECT w.id,
           ROW_NUMBER() OVER (
             PARTITION BY w.source
             ORDER BY w.date_time DESC NULLS LAST, w.id DESC
           ) AS rn
      FROM webinars w
      JOIN (
        SELECT source,
               COALESCE(MAX(date_time) FILTER (WHERE is_active), MAX(date_time)) AS cap
          FROM webinars
         GROUP BY source
      ) caps ON caps.source = w.source
     WHERE w.date_time <= caps.cap
  ) ranked
  WHERE ranked.rn <= 2
)`;

async function runOnce() {
  // 1. Configured delay (ms). Falls back to the schema default.
  let delayMs = 600000;
  try {
    const { rows } = await pool.query('SELECT settings FROM timer_settings WHERE id = 1');
    const merged = mergeTimerSettings(rows[0]?.settings);
    if (Number.isFinite(merged.mgrEmptyLeadsAlertDelayMs)) delayMs = merged.mgrEmptyLeadsAlertDelayMs;
  } catch (e) {
    console.error('[emptyQueueAlert] timer_settings read failed; using default delay:', e.message);
  }

  // 2. Every active caller + whether their Assigned page is currently empty.
  const { rows: callers } = await pool.query(
    `SELECT u.id, u.full_name, u.role, u.department, u.team_leader_id,
            NOT EXISTS (
              SELECT 1 FROM leads l
               WHERE l.assigned_user_id = u.id
                 AND l.next_batch_parked = FALSE
                 AND (
                   l.last_note_outcome IS NULL
                   OR (l.last_note_outcome = 'follow_up' AND l.follow_up_at <= NOW())
                 )
                 AND (
                   l.webinar_id IS NULL
                   OR l.webinar_id IN ${RECENT_WEBINARS_SQL}
                   OR l.pinned_at IS NOT NULL
                 )
            ) AS is_empty
       FROM crm_users u
      WHERE u.role IN ('junior_caller','senior_caller')
        AND u.is_active = TRUE
        AND u.deleted_at IS NULL`
  );

  // 3. Maintain the empty-streak state table.
  const callerById = new Map();
  for (const c of callers) {
    callerById.set(c.id, c);
    if (c.is_empty) {
      // Start a streak (keeps the original empty_since on re-run).
      await pool.query(
        `INSERT INTO caller_empty_queue_alert (caller_id, empty_since)
         VALUES ($1, NOW()) ON CONFLICT (caller_id) DO NOTHING`,
        [c.id]
      );
    } else {
      // Queue refilled — clear so a future empty streak can alert again.
      await pool.query('DELETE FROM caller_empty_queue_alert WHERE caller_id = $1', [c.id]);
    }
  }

  // 4. Find streaks that have crossed the delay and not yet alerted.
  const { rows: due } = await pool.query(
    `SELECT caller_id FROM caller_empty_queue_alert
      WHERE alerted_at IS NULL
        AND empty_since <= NOW() - (INTERVAL '1 millisecond' * $1)`,
    [delayMs]
  );

  const minutes = Math.max(1, Math.round(delayMs / 60000));
  for (const d of due) {
    // Claim atomically so we send exactly once even if two ticks overlap.
    const claim = await pool.query(
      `UPDATE caller_empty_queue_alert SET alerted_at = NOW()
        WHERE caller_id = $1 AND alerted_at IS NULL
        RETURNING caller_id`,
      [d.caller_id]
    );
    if (claim.rows.length === 0) continue;
    const caller = callerById.get(d.caller_id);
    if (!caller) continue; // caller deactivated/deleted between queries
    await notifyEmptyQueue(caller, minutes);
    console.log(`[emptyQueueAlert] manager alerted — ${caller.full_name} empty ${minutes}m`);
  }

  return { checked: callers.length, alerted: due.length };
}

function startScheduler({ intervalMs = 60000 } = {}) {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _timer = setInterval(() => {
    runOnce().catch(e => console.error('[emptyQueueAlert] tick error:', e.message));
  }, intervalMs);
  console.log(`[emptyQueueAlert] scheduler started — every ${intervalMs / 1000}s`);
}

function stopScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startScheduler, stopScheduler, runOnce };
