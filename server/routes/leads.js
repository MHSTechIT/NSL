const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const supabase = require('../supabase');

function computeLeadScore(sugarLevel, duration) {
  if (duration === 'pre') return 2;
  const sugarScore = sugarLevel === '250+' ? 3 : 2;
  const durationBonus = { long: 2, mid: 1, new: 0 }[duration] ?? 0;
  return Math.min(5, sugarScore + durationBonus);
}

function getISTDayOfWeek() {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
  return istString; // 'Mon', 'Tue', 'Wed', etc.
}

const validators = [
  body('full_name').trim().isLength({ min: 2 }).matches(/^[a-zA-Z\s]+$/),
  body('whatsapp_number').trim().matches(/^\d{10}$/),
  body('email').trim().isEmail().normalizeEmail(),
  body('sugar_level').isIn(['150-250', '250+']),
  body('diabetes_duration').isIn(['new', 'mid', 'long', 'pre']),
  body('language_pref').isIn(['tamil', 'english']),
];

router.post('/leads', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'validation_failed',
      fields: errors.array().map(e => e.path),
    });
  }

  const { data: configData, error: configError } = await supabase
    .from('webinar_config')
    .select('kill_switch, tuesday_whatsapp_link, friday_whatsapp_link')
    .eq('id', 1)
    .maybeSingle();

  const config = configData || { kill_switch: false, tuesday_whatsapp_link: '', friday_whatsapp_link: '' };
  if (configError) console.warn('Config fetch warning:', configError.message);

  if (config.kill_switch) {
    return res.status(409).json({ success: false, error: 'registrations_paused' });
  }

  const { full_name, whatsapp_number, email, sugar_level, diabetes_duration,
          language_pref, utm_source, utm_campaign, utm_content, fbclid } = req.body;

  const lead_score = computeLeadScore(sugar_level, diabetes_duration);
  const day = getISTDayOfWeek();
  const whatsapp_link = (day === 'Mon' || day === 'Tue')
    ? config.tuesday_whatsapp_link
    : config.friday_whatsapp_link;

  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      full_name,
      whatsapp_number,
      email,
      sugar_level,
      diabetes_duration,
      language_pref,
      lead_score,
      utm_source: utm_source || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      fbclid: fbclid || null,
    })
    .select('id')
    .single();

  if (insertError) return res.status(500).json({ success: false, error: 'server_error' });

  res.status(201).json({
    success: true,
    lead_id: lead.id,
    lead_score,
    whatsapp_link,
  });
});

/* PATCH /api/leads/:id/wa-click — mark that user clicked the WhatsApp button */
router.patch('/leads/:id/wa-click', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false });

  const { error } = await supabase
    .from('leads')
    .update({ wa_clicked: true })
    .eq('id', id);

  if (error) {
    console.error('wa-click update error:', error.message);
    return res.status(500).json({ success: false });
  }
  res.json({ success: true });
});

module.exports = router;
