/*
 * /api/admin/telegram-alerts — manage Telegram alert recipients.
 *
 *   GET    /                  → list all recipients (joined with TL name)
 *   POST   /                  → create a recipient
 *   PATCH  /:id               → update a recipient
 *   DELETE /:id               → remove a recipient
 *   POST   /:id/test          → send a test ping to that chat
 *
 * Auth: protected by the same adminAuth bearer the rest of /api/admin uses.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth }      = require('../middleware/adminAuth');
const { sendTelegram }   = require('../utils/telegramNotifier');

router.use(adminAuth);

/* ── GET /api/admin/telegram-alerts ─────────────────────────────────── */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id,
             r.telegram_chat_id,
             r.target_type,
             r.team_leader_id,
             r.department,
             r.label,
             r.created_at,
             tl.full_name AS team_leader_name
        FROM telegram_alert_recipients r
        LEFT JOIN crm_users tl ON tl.id = r.team_leader_id
       ORDER BY r.created_at DESC
    `);
    res.json({ recipients: rows });
  } catch (err) {
    console.error('GET /telegram-alerts error:', err.message);
    res.status(500).json({ error: 'Failed to load Telegram recipients.' });
  }
});

/* ── POST /api/admin/telegram-alerts ────────────────────────────────── */
router.post(
  '/',
  body('telegram_chat_id').isString().trim().notEmpty().withMessage('Telegram User ID is required.'),
  body('target_type').isIn(['team_leader', 'manager']).withMessage('target_type must be team_leader or manager.'),
  body('team_leader_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid team_leader_id.'),
  body('department').optional({ nullable: true, checkFalsy: true }).isIn(['sales', 'marketing']).withMessage('Department must be sales or marketing.'),
  body('label').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { telegram_chat_id, target_type, team_leader_id, department, label } = req.body;

    // Schema-level CHECK enforces this too — surface a friendly error first.
    if (target_type === 'team_leader' && !team_leader_id) {
      return res.status(400).json({ error: 'team_leader_id is required when target_type=team_leader.' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO telegram_alert_recipients
           (telegram_chat_id, target_type, team_leader_id, department, label)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          String(telegram_chat_id).trim(),
          target_type,
          target_type === 'team_leader' ? team_leader_id : null,
          target_type === 'manager'     ? (department || null) : null,
          label || null,
        ]
      );
      res.status(201).json({ id: rows[0].id });
    } catch (err) {
      console.error('POST /telegram-alerts error:', err.message);
      res.status(500).json({ error: 'Failed to create recipient.' });
    }
  }
);

/* ── PATCH /api/admin/telegram-alerts/:id ───────────────────────────── */
router.patch('/:id', async (req, res) => {
  const allowed = ['telegram_chat_id', 'target_type', 'team_leader_id', 'department', 'label'];
  const set = [];
  const vals = [];
  for (const k of allowed) {
    if (k in req.body) {
      set.push(`${k} = $${set.length + 1}`);
      vals.push(req.body[k] === '' ? null : req.body[k]);
    }
  }
  if (set.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  vals.push(req.params.id);
  try {
    const { rowCount } = await pool.query(
      `UPDATE telegram_alert_recipients SET ${set.join(', ')} WHERE id = $${vals.length}`,
      vals
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Recipient not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /telegram-alerts error:', err.message);
    res.status(500).json({ error: 'Failed to update recipient.' });
  }
});

/* ── DELETE /api/admin/telegram-alerts/:id ──────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM telegram_alert_recipients WHERE id = $1`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Recipient not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /telegram-alerts error:', err.message);
    res.status(500).json({ error: 'Failed to delete recipient.' });
  }
});

/* ── POST /api/admin/telegram-alerts/:id/test ───────────────────────── */
router.post('/:id/test', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT telegram_chat_id, label FROM telegram_alert_recipients WHERE id = $1`,
      [req.params.id]
    );
    const r = rows[0];
    if (!r) return res.status(404).json({ error: 'Recipient not found.' });

    const result = await sendTelegram(
      r.telegram_chat_id,
      `✅ <b>MHS CRM test message</b>\n\nIf you can read this, alerts are wired up correctly for <b>${r.label || 'this recipient'}</b>.`
    );
    if (!result.ok) return res.status(502).json({ error: result.error || 'Telegram send failed.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /telegram-alerts/:id/test error:', err.message);
    res.status(500).json({ error: 'Test send failed.' });
  }
});

module.exports = router;
