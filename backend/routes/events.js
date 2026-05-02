const express = require('express');
const router  = express.Router();
const pool    = require('../db');

const VALID_EVENTS = new Set([
  'cta_clicked',
  'sugar_150_250',
  'sugar_250_plus',
  'disqualified_no_diabetes',
  'tamil_yes',
  'tamil_no',
  'duration_new',
  'duration_mid',
  'duration_long',
  'registration_submitted',
  'wa_join_clicked',
  'youtube_clicked',
  'explore_product_clicked',
]);

/* POST /api/events — public, fire-and-forget click tracking */
router.post('/events', (req, res) => {
  // Respond immediately — never block the user
  res.json({ ok: true });

  const { event_name, webinar_at } = req.body || {};
  if (!VALID_EVENTS.has(event_name)) return;

  const ts = webinar_at ? new Date(webinar_at) : null;
  pool.query(
    'INSERT INTO click_events (event_name, webinar_at) VALUES ($1, $2)',
    [event_name, ts && !isNaN(ts) ? ts : null]
  ).catch(err => console.error('[events] insert error:', err.message));
});

module.exports = router;
