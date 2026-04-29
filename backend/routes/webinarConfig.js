const express = require('express');
const router = express.Router();
const pool = require('../db');
const cache = require('../utils/webinarConfigCache');
const { addClient, removeClient, broadcast } = require('../utils/sseClients');

/**
 * Check if a scheduled WhatsApp link swap is due and execute it immediately.
 * Called on every GET /webinar-config so it fires even after Render wakes from sleep.
 * Returns the updated row if a swap happened, otherwise null.
 */
async function checkAndExecutePendingSwap() {
  try {
    const result = await pool.query(`
      UPDATE webinar_config
      SET tuesday_whatsapp_link = pending_whatsapp_link,
          friday_whatsapp_link  = pending_whatsapp_link,
          pending_whatsapp_link = '',
          whatsapp_link_swap_at = NULL,
          updated_at            = NOW()
      WHERE id = 1
        AND whatsapp_link_swap_at IS NOT NULL
        AND whatsapp_link_swap_at <= NOW()
        AND pending_whatsapp_link IS NOT NULL
        AND pending_whatsapp_link != ''
      RETURNING next_webinar_at, backup_webinar_at, tuesday_whatsapp_link,
                friday_whatsapp_link, kill_switch, pending_whatsapp_link,
                whatsapp_link_swap_at
    `);

    if (result.rowCount > 0) {
      console.log('[Swap] WhatsApp link auto-swapped on request at', new Date().toISOString());
      cache.invalidate();
      broadcast(result.rows[0]);
      return result.rows[0];
    }
  } catch (err) {
    console.error('[Swap] checkAndExecutePendingSwap error:', err.message);
  }
  return null;
}

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

  // Always check for a due scheduled swap first — this makes the swap
  // fire on the very next page load even if Render was sleeping when
  // the scheduled time passed.
  const swapped = await checkAndExecutePendingSwap();

  // If a swap just happened, skip the cache and fetch fresh counts
  if (!swapped) {
    const hit = cache.get();
    if (hit) return res.json(hit);
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
