const express  = require('express');
const { body, validationResult } = require('express-validator');
const crypto   = require('crypto');
const router   = express.Router();
const supabase = require('../supabase');
const { adminAuth }              = require('../middleware/adminAuth');
const { getPassword, writeConfig } = require('../utils/adminConfig');

router.use(adminAuth);

/* ── GET /api/admin/leads ── */
router.get('/leads', async (req, res) => {
  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch leads' });
  res.json({ leads: data, total: count });
});

/* ── PUT /api/admin/webinar-config ── */
const configValidators = [
  body('next_webinar_at').optional().isISO8601(),
  body('backup_webinar_at').optional().isISO8601(),
  body('tuesday_whatsapp_link').optional().isString(),
  body('friday_whatsapp_link').optional().isString(),
  body('kill_switch').optional().isBoolean(),
];

router.put('/webinar-config', configValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'validation_failed', fields: errors.array() });
  }

  const allowed = ['next_webinar_at', 'backup_webinar_at', 'tuesday_whatsapp_link', 'friday_whatsapp_link', 'kill_switch'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('webinar_config')
    .update(updates)
    .eq('id', 1);

  if (error) return res.status(500).json({ error: 'Failed to update config' });
  res.json({ success: true, updated_at: updates.updated_at });
});

/* ── PATCH /api/admin/change-password ──
   Verifies current password, writes new password to local file.
   No database involved — fully autonomous.
── */
router.patch('/change-password',
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'New password must be at least 6 characters.' });
    }

    const { current_password, new_password } = req.body;
    const expected = getPassword();

    /* Constant-time compare of supplied current password */
    const a = Buffer.alloc(Math.max(current_password.length, expected.length));
    const b = Buffer.alloc(Math.max(current_password.length, expected.length));
    Buffer.from(current_password).copy(a);
    Buffer.from(expected).copy(b);

    if (current_password.length !== expected.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    try {
      writeConfig({ password: new_password });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to save new password.' });
    }
  }
);

module.exports = router;
