/* One-shot survey of every distinct hangup_by value on calls in the
   last 7 days, plus a count per value. Tells us what Tata actually
   stamps so the LeadCallNoteModal's shouldRunFormTimerFor() rule
   ('customer' = run 45s timer, else = no timer) can be aligned with
   real-world values. */
require('dotenv').config();
const pool = require('../db');

(async () => {
  try {
    console.log('\n── Distinct hangup_by values over last 7 days ──\n');
    const { rows: vals } = await pool.query(`
      SELECT COALESCE(hangup_by, '(null)') AS hangup_by,
             COUNT(*)::int AS calls,
             COUNT(*) FILTER (WHERE customer_answered_at IS NOT NULL)::int AS customer_answered,
             COUNT(*) FILTER (WHERE customer_answered_at IS NULL)::int AS customer_didnt_answer
        FROM calls
       WHERE started_at > NOW() - INTERVAL '7 days'
       GROUP BY hangup_by
       ORDER BY calls DESC
    `);
    if (vals.length === 0) {
      console.log('No calls in the last 7 days.');
    } else {
      console.log('hangup_by'.padEnd(20), 'calls'.padStart(6), 'cust_ans'.padStart(10), 'cust_noans'.padStart(12));
      console.log('-'.repeat(54));
      for (const r of vals) {
        console.log(String(r.hangup_by).padEnd(20), String(r.calls).padStart(6), String(r.customer_answered).padStart(10), String(r.customer_didnt_answer).padStart(12));
      }
    }

    console.log('\n── Most recent 5 calls with customer_answered_at set ──\n');
    const { rows: recent } = await pool.query(`
      SELECT id, started_at, customer_answered_at, ended_at,
             duration_sec, hangup_by, status
        FROM calls
       WHERE customer_answered_at IS NOT NULL
       ORDER BY started_at DESC
       LIMIT 5
    `);
    for (const r of recent) {
      console.log({
        id: r.id.slice(0, 8) + '…',
        started_at: r.started_at,
        answered:   r.customer_answered_at,
        ended_at:   r.ended_at,
        duration:   r.duration_sec,
        hangup_by:  r.hangup_by || '(null)',
        status:     r.status,
      });
    }
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
