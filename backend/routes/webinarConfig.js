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

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

router.get('/webinar-config', async (req, res) => {
  res.set(NO_CACHE_HEADERS);

  const hit = cache.get();
  if (hit) {
    return res.json(hit);
  }

  try {
    const [configResult, countResult] = await Promise.all([
      pool.query(
        'SELECT next_webinar_at, backup_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link, kill_switch, pending_whatsapp_link, whatsapp_link_swap_at FROM webinar_config WHERE id = 1'
      ),
      pool.query('SELECT COUNT(*) FROM leads'),
    ]);

    if (configResult.rows.length === 0) {
      return res.json({ ...DEFAULT_CONFIG, seats_reserved: 1813 });
    }

    const seats_reserved = 1813 + parseInt(countResult.rows[0].count, 10);
    const payload = { ...configResult.rows[0], seats_reserved };

    cache.set(payload);
    res.json(payload);
  } catch (err) {
    console.error('webinar-config error:', err.message);
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
