const express = require('express');
const cors    = require('cors');
const pool    = require('./db');

const webinarConfigRouter = require('./routes/webinarConfig');
const leadsRouter         = require('./routes/leads');
const adminRouter         = require('./routes/admin');
const authRouter          = require('./routes/auth');
const eventsRouter        = require('./routes/events');

const app = express();

// Auto-migrate: add slot-2 columns if they don't exist yet
const _migrationResult = pool.query(`
  ALTER TABLE webinar_config
    ADD COLUMN IF NOT EXISTS pending_whatsapp_link_2 TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS whatsapp_link_swap_at_2 TIMESTAMPTZ DEFAULT NULL
`);
if (_migrationResult && typeof _migrationResult.catch === 'function') {
  _migrationResult.catch(err => console.error('[Migration] slot-2 columns error:', err.message));
}

// Auto-migrate: create click_events table for button analytics
const _clickMigration = pool.query(`
  CREATE TABLE IF NOT EXISTS click_events (
    id          BIGSERIAL PRIMARY KEY,
    event_name  TEXT        NOT NULL,
    webinar_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_click_events_name       ON click_events (event_name);
  CREATE INDEX IF NOT EXISTS idx_click_events_webinar_at ON click_events (webinar_at);
  CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events (created_at);
`);
if (_clickMigration && typeof _clickMigration.catch === 'function') {
  _clickMigration.catch(err => console.error('[Migration] click_events error:', err.message));
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api',       webinarConfigRouter);
app.use('/api',       leadsRouter);
app.use('/api',       eventsRouter);
app.use('/api/auth',  authRouter);
app.use('/api/admin', adminRouter);

module.exports = app;
