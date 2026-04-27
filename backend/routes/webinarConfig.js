const express = require('express');
const router = express.Router();
const pool = require('../db');
const cache = require('../utils/webinarConfigCache');
const { addClient, removeClient } = require('../utils/sseClients');

const DEFAULT_CONFIG = {
  next_webinar_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  backup_webinar_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  tuesday_whatsapp_link: '',
  friday_whatsapp_link: '',
  kill_switch: false,
};

router.get('/webinar-config', async (req, res) => {
  const hit = cache.get();
  if (hit) {
    res.set('Cache-Control', 'no-store');
    return res.json(hit);
  }

  try {
    const [configResult, countResult] = await Promise.all([
      pool.query(
        'SELECT next_webinar_at, backup_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link, kill_switch FROM webinar_config WHERE id = 1'
      ),
      pool.query('SELECT COUNT(*) FROM leads'),
    ]);

    if (configResult.rows.length === 0) {
      res.set('Cache-Control', 'no-cache');
      return res.json({ ...DEFAULT_CONFIG, seats_reserved: 1813 });
    }

    const seats_reserved = 1813 + parseInt(countResult.rows[0].count, 10);
    const payload = { ...configResult.rows[0], seats_reserved };

    cache.set(payload);
    res.set('Cache-Control', 'no-store');
    res.json(payload);
  } catch (err) {
    console.error('webinar-config error:', err.message);
    res.set('Cache-Control', 'no-cache');
    res.json({ ...DEFAULT_CONFIG, seats_reserved: 1813 });
  }
});

router.get('/webinar-config/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': connected\n\n');

  addClient(res);

  req.on('close', () => removeClient(res));
});

module.exports = router;
