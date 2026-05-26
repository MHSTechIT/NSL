/* One-shot: add 20 test leads to caller Hari on phone 8778934601.
   ----------------------------------------------------------------
   ADDITIVE only — does NOT park or modify Hari's existing assigned
   leads. Mirrors the seed-hari-9176-test-leads.js insert block
   (same phone, score, sugar, duration distribution) so the new
   rows are indistinguishable from the previous 9176 / 9345 test
   batches.

   Run from crm/backend:
     node scripts/seed-hari-8778-test-leads.js
*/

require('dotenv').config();
const pool = require('../db');

const TEST_NUMBER = '8778934601';
const COUNT       = 20;

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

    // 3. Insert 20 test leads, each with a unique full_name + email.
    const stamp     = Date.now();
    const sugars    = ['150-250', '250+'];
    const durations = ['new', 'mid', 'long', 'pre'];
    const langs     = ['tamil', 'english'];
    let inserted = 0;
    for (let i = 1; i <= COUNT; i++) {
      const fullName = `Hari Test ${String(i).padStart(2, '0')}`;
      const email    = `hari.test.8778.${stamp}.${i}@example.com`;
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
