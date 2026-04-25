const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const cache = require('../utils/webinarConfigCache');

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
    res.set('Cache-Control', 'public, max-age=60');
    return res.json(hit);
  }

  const { data, error } = await supabase
    .from('webinar_config')
    .select('next_webinar_at, backup_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link, kill_switch')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    res.set('Cache-Control', 'no-cache');
    return res.json(DEFAULT_CONFIG);
  }

  cache.set(data);
  res.set('Cache-Control', 'public, max-age=60');
  res.json(data);
});

module.exports = router;
