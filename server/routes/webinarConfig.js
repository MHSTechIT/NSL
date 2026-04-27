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

  // Run both queries in parallel — zero extra delay
  const [configResult, countResult] = await Promise.all([
    supabase
      .from('webinar_config')
      .select('next_webinar_at, backup_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link, kill_switch')
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true }),
  ]);

  if (configResult.error || !configResult.data) {
    res.set('Cache-Control', 'no-cache');
    return res.json({ ...DEFAULT_CONFIG, seats_reserved: 1813 });
  }

  const seats_reserved = 1813 + (countResult.count ?? 0);
  const payload = { ...configResult.data, seats_reserved };

  cache.set(payload);
  res.set('Cache-Control', 'public, max-age=60');
  res.json(payload);
});

module.exports = router;
