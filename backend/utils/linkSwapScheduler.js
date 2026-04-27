const pool = require('../db');
const cache = require('./webinarConfigCache');
const { broadcast } = require('./sseClients');

function startLinkSwapScheduler() {
  setInterval(async () => {
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
        cache.invalidate();
        cache.set(result.rows[0]);
        broadcast(result.rows[0]);
        console.log('WhatsApp link auto-swapped at', new Date().toISOString());
      }
    } catch (err) {
      console.error('Link swap scheduler error:', err.message);
    }
  }, 30_000);
}

module.exports = { startLinkSwapScheduler };
