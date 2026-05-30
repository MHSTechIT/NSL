const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const pool = require('../db');
const { rotateLink } = require('../utils/linkRotation');
// assignNewLead is not called from this route in the split deployment — see
// the pg_notify block in the POST handler. The lead-assigner runs only on
// the CRM service (driven by the 'lead.created' notification).

function computeLeadScore(sugarLevel, duration) {
  if (duration === 'pre') return 2;
  const sugarScore = sugarLevel === '250+' ? 3 : 2;
  const durationBonus = { long: 2, mid: 1, new: 0 }[duration] ?? 0;
  return Math.min(5, sugarScore + durationBonus);
}

function getISTDayOfWeek() {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
}

const validators = [
  body('full_name').trim().isLength({ min: 2 }).matches(/^[a-zA-Z\s]+$/),
  body('whatsapp_number').trim().matches(/^\d{10}$/),
  body('email').trim().isEmail().normalizeEmail(),
  body('sugar_level').isIn(['150-250', '250+']),
  body('diabetes_duration').isIn(['new', 'mid', 'long', 'pre']),
  body('language_pref').isIn(['tamil', 'english']),
  // New single-page funnel qualification fields (optional for back-compat
  // with old multi-page funnels still posting the original 6-field shape).
  body('on_medication').optional({ nullable: true }).isIn(['insulin', 'tablets', 'none']),
  // The `age_group` column was repurposed on the Meta funnel to record the
  // answer to "Do you know Tamil?" (yes/no). Old age-bucket values are kept
  // in the allow-list so back-compat with the YT funnel + any in-flight
  // browser sessions on the previous build is preserved.
  body('age_group').optional({ nullable: true }).isIn(['35-45', '45-55', '55+', 'yes', 'no']),
  body('occupation').optional({ nullable: true }).isIn(['working', 'housewife', 'retired']),
];

// This backend only ever serves the Meta 2.0 funnel — leads default to 'meta2'.
const ALLOWED_SOURCES = new Set(['meta', 'yt', 'meta2']);
function normalizeSource(value) {
  return ALLOWED_SOURCES.has(value) ? value : 'meta2';
}

router.post('/leads', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'validation_failed',
      fields: errors.array().map(e => e.path),
    });
  }

  const source = normalizeSource(req.body.source);

  // Fetch config for this source
  let config = { kill_switch: false, tuesday_whatsapp_link: '', friday_whatsapp_link: '' };
  try {
    const { rows } = await pool.query(
      'SELECT kill_switch, tuesday_whatsapp_link, friday_whatsapp_link FROM webinar_config WHERE source = $1',
      [source]
    );
    if (rows.length > 0) config = rows[0];
  } catch (err) {
    console.warn('Config fetch warning:', err.message);
  }

  if (config.kill_switch) {
    return res.status(409).json({ success: false, error: 'registrations_paused' });
  }

  const { full_name, whatsapp_number, email, sugar_level, diabetes_duration,
          language_pref, on_medication, age_group, occupation,
          utm_source, utm_campaign, utm_content, fbclid } = req.body;

  // Visitor ID from the client's localStorage. Lets us tie this lead to
  // its pre-registration page_visited events for Option-C unique-visitor
  // dedupe via the lead's phone number.
  const visitor_id = typeof req.body.visitor_id === 'string'
    ? req.body.visitor_id.slice(0, 64)
    : null;

  const lead_score = computeLeadScore(sugar_level, diabetes_duration);
  const day = getISTDayOfWeek();
  const whatsapp_link = (day === 'Mon' || day === 'Tue')
    ? config.tuesday_whatsapp_link
    : config.friday_whatsapp_link;

  // Look up the currently active webinar session for this source
  let webinar_id = null;
  try {
    const { rows: wRows } = await pool.query(
      'SELECT id FROM webinars WHERE is_active = TRUE AND source = $1 LIMIT 1',
      [source]
    );
    webinar_id = wRows[0]?.id ?? null;
  } catch (_) { /* webinars table may not exist yet — safe to skip */ }

  try {
    const { rows } = await pool.query(
      `INSERT INTO leads
        (full_name, whatsapp_number, email, sugar_level, diabetes_duration,
         language_pref, on_medication, age_group, occupation,
         lead_score, utm_source, utm_campaign, utm_content, fbclid,
         webinar_id, source, visitor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        full_name, whatsapp_number, email, sugar_level, diabetes_duration,
        language_pref, on_medication || null, age_group || null, occupation || null,
        lead_score,
        utm_source || null, utm_campaign || null, utm_content || null, fbclid || null,
        webinar_id, source, visitor_id,
      ]
    );

    res.status(201).json({
      success: true,
      lead_id: rows[0].id,
      lead_score,
      whatsapp_link,
    });

    // Fire-and-forget: rotate WhatsApp link if lead count crossed a threshold
    if (webinar_id) {
      rotateLink(webinar_id).catch(e => console.error('[LinkRotation] post-lead error:', e.message));
    }

    // Fire-and-forget: round-robin assign this lead to an eligible caller.
    //
    // Post-split this no longer happens in-process — funnel-meta and funnel-yt
    // don't run the assigner directly because the round-robin state lives on
    // the CRM service. Instead we fire pg_notify('lead.created') and the CRM
    // service's LISTEN handler picks it up and runs assignNewLead there.
    //
    // The single-process app.js dev entry registers its OWN LISTEN handler
    // for the same channel so this still works end-to-end in dev mode.
    if (webinar_id) {
      pool.query(
        `SELECT pg_notify('lead.created', $1)`,
        [JSON.stringify({
          leadId:     rows[0].id,
          source,
          sugarLevel: sugar_level,
          webinarId:  webinar_id,
        })]
      ).catch(e => console.error('[Assigner notify] post-lead error:', e.message));
    }
  } catch (err) {
    console.error('Lead insert error:', err.message);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/* PATCH /api/leads/:id/wa-click */
router.patch('/leads/:id/wa-click', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false });

  try {
    const { rows } = await pool.query(
      `UPDATE leads SET wa_clicked = true WHERE id = $1
       RETURNING full_name, whatsapp_number, email, sugar_level,
                 diabetes_duration, on_medication, age_group, occupation,
                 lead_score`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('wa-click update error:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
module.exports._computeLeadScore = computeLeadScore;
module.exports._getISTDayOfWeek  = getISTDayOfWeek;
