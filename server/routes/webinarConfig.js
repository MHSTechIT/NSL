const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

const DEFAULT_CONFIG = {
  next_webinar_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  backup_webinar_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  tuesday_whatsapp_link: '',
  friday_whatsapp_link: '',
  kill_switch: false,
};

router.get('/webinar-config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webinar_config')
      .select('next_webinar_at, backup_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link, kill_switch')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      // Return default config if DB not yet seeded or RLS is blocking
      res.set('Cache-Control', 'no-cache');
      return res.json(DEFAULT_CONFIG);
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    // Supabase client threw (e.g. missing env vars) — fall back to defaults
    console.error('webinar-config error:', err.message);
    res.set('Cache-Control', 'no-cache');
    res.json(DEFAULT_CONFIG);
  }
});

module.exports = router;
