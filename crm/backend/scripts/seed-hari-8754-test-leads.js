/* One-shot: clear caller Hari's Assigned page and seed 10 fresh test leads.
   ----------------------------------------------------------------------
   1. Park every lead CURRENTLY ON Hari's Assigned page
      (next_batch_parked = TRUE). Real customer leads are NOT deleted —
      they only move to the Next-Batch bucket, which is fully reversible.
   2. Insert 10 test leads (whatsapp_number 8754689554) assigned to Hari
      on the active webinar so they show up on his Assigned page.

   Run from crm/backend:
     node scripts/seed-hari-8754-test-leads.js
*/

require('dotenv').config();
const pool = require('../db');

const TEST_NUMBER = '8754689554';
const COUNT       = 10;

/* Top-2-recent-webinars-per-source window — mirrors the Assigned page query
   in routes/caller.js so we park EXACTLY the leads visible there (and the
   new test leads land inside this same window). */
const RECENT_WEBINARS = `(
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

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find Hari.
    const { rows: callers } = await client.query(
      `SELECT id, full_name, email FROM crm_users
        WHERE LOWER(full_name) LIKE 'hari%'
          AND role IN ('junior_caller','senior_caller')
        ORDER BY is_active DESC, created_at ASC
        LIMIT 1`
    );
    if (callers.length === 0) throw new Error('No caller named Hari found.');
    const hari = callers[0];
    console.log(`Caller: ${hari.full_name} <${hari.email}>  id=${hari.id}`);

    // 2. Active webinar (+ its source) for the new test leads.
    const { rows: webs } = await client.query(
      `SELECT id, name, source FROM webinars
        WHERE is_active = TRUE
        ORDER BY date_time DESC NULLS LAST, id DESC
        LIMIT 1`
    );
    if (webs.length === 0) throw new Error('No active webinar found.');
    const webinarId = webs[0].id;
    const source    = webs[0].source || 'meta';
    console.log(`Webinar: ${webs[0].name}  id=${webinarId}  source=${source}`);

    // 3. Park every lead currently on Hari's Assigned page.
    const { rows: parked } = await client.query(
      `UPDATE leads
          SET next_batch_parked    = TRUE,
              next_batch_parked_at = NOW()
        WHERE assigned_user_id = $1
          AND next_batch_parked = FALSE
          AND (last_note_outcome IS NULL
               OR (last_note_outcome = 'follow_up' AND follow_up_at <= NOW()))
          AND (webinar_id IS NULL OR webinar_id IN ${RECENT_WEBINARS})
        RETURNING id`,
      [hari.id]
    );
    console.log(`Parked ${parked.length} lead(s) off Hari's Assigned page → Next Batch (reversible).`);

    // 4. Insert 10 test leads, each with a unique full_name + email.
    const stamp     = Date.now();
    const sugars    = ['150-250', '250+'];
    const durations = ['new', 'mid', 'long', 'pre'];
    const langs     = ['tamil', 'english'];
    let inserted = 0;
    for (let i = 1; i <= COUNT; i++) {
      const fullName = `Hari Test ${String(i).padStart(2, '0')}`;
      const email    = `hari.test.8754.${stamp}.${i}@example.com`;
      const sugar    = sugars[i % sugars.length];
      const duration = durations[i % durations.length];
      const lang     = langs[i % langs.length];
      const score    = duration === 'pre'
        ? 2
        : Math.min(5, (sugar === '250+' ? 3 : 2) + ({ long: 2, mid: 1, new: 0 }[duration] ?? 0));
      const { rows } = await client.query(
        `INSERT INTO leads
           (full_name, whatsapp_number, email, sugar_level, diabetes_duration,
            language_pref, lead_score, wa_clicked, webinar_id, source,
            assigned_user_id, assigned_at, next_batch_parked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,$8,$9,$10,NOW(),FALSE)
         RETURNING id`,
        [fullName, TEST_NUMBER, email, sugar, duration, lang, score, webinarId, source, hari.id]
      );
      inserted++;
      console.log(`  [${String(i).padStart(2, '0')}/${COUNT}] lead_id=${rows[0].id}  score=${score}  ${sugar}/${duration}`);
    }
    console.log(`Inserted ${inserted} test lead(s) on ${TEST_NUMBER}.`);

    // 5. Verify Hari's Assigned-page count.
    const { rows: after } = await client.query(
      `SELECT COUNT(*)::int AS n FROM leads
        WHERE assigned_user_id = $1
          AND next_batch_parked = FALSE
          AND (last_note_outcome IS NULL
               OR (last_note_outcome = 'follow_up' AND follow_up_at <= NOW()))
          AND (webinar_id IS NULL OR webinar_id IN ${RECENT_WEBINARS})`,
      [hari.id]
    );
    console.log(`\nHari's Assigned page now shows ${after[0].n} lead(s) — expected ${COUNT}.`);

    await client.query('COMMIT');
    console.log('Done. (committed)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FAILED (rolled back):', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
