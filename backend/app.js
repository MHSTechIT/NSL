const express = require('express');
const cors    = require('cors');
const pool    = require('./db');

const webinarConfigRouter = require('./routes/webinarConfig');
const leadsRouter         = require('./routes/leads');
const adminRouter         = require('./routes/admin');
const authRouter          = require('./routes/auth');

const app = express();

// Auto-migrate: add slot-2 columns if they don't exist yet
pool.query(`
  ALTER TABLE webinar_config
    ADD COLUMN IF NOT EXISTS pending_whatsapp_link_2 TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS whatsapp_link_swap_at_2 TIMESTAMPTZ DEFAULT NULL
`).catch(err => console.error('[Migration] slot-2 columns error:', err.message));

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api',       webinarConfigRouter);
app.use('/api',       leadsRouter);
app.use('/api/auth',  authRouter);
app.use('/api/admin', adminRouter);

module.exports = app;
