const pool = require('../db');
const cache = require('./webinarConfigCache');
const { broadcast } = require('./sseClients');

async function runSwaps() {
  try {
    // Slot 1
    await pool.query(`
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
    `);

    // Slot 2
    await pool.query(`
      UPDATE webinar_config
      SET tuesday_whatsapp_link  = pending_whatsapp_link_2,
          friday_whatsapp_link   = pending_whatsapp_link_2,
          pending_whatsapp_link_2 = '',
          whatsapp_link_swap_at_2 = NULL,
          updated_at             = NOW()
      WHERE id = 1
        AND whatsapp_link_swap_at_2 IS NOT NULL
        AND whatsapp_link_swap_at_2 <= NOW()
        AND pending_whatsapp_link_2 IS NOT NULL
        AND pending_whatsapp_link_2 != ''
    `);

    // Fetch fresh after both updates
    const { rows, rowCount } = await pool.query(`
      SELECT next_webinar_at, backup_webinar_at, tuesday_whatsapp_link,
             friday_whatsapp_link, kill_switch,
             pending_whatsapp_link, whatsapp_link_swap_at,
             pending_whatsapp_link_2, whatsapp_link_swap_at_2
      FROM webinar_config WHERE id = 1
    `);
    if (rowCount > 0) {
      cache.invalidate();
      cache.set(rows[0]);
      broadcast(rows[0]);
      console.log('WhatsApp link swap check at', new Date().toISOString());
    }
  } catch (err) {
    console.error('Link swap scheduler error:', err.message);
  }
}

function startLinkSwapScheduler() {
  setInterval(runSwaps, 30_000);
}

module.exports = { startLinkSwapScheduler };
