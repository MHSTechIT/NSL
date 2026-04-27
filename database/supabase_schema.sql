-- ============================================================
-- MHS Diabetes Webinar Funnel — PostgreSQL Schema
-- Run this ONCE in pgAdmin Query Tool on nsl_database
-- ============================================================

-- 1. webinar_config table (single-row config)
CREATE TABLE IF NOT EXISTS webinar_config (
  id                    INTEGER PRIMARY KEY DEFAULT 1,
  next_webinar_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '4 days',
  backup_webinar_at     TIMESTAMPTZ,
  tuesday_whatsapp_link TEXT NOT NULL DEFAULT '',
  friday_whatsapp_link  TEXT NOT NULL DEFAULT '',
  kill_switch           BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 2. leads table
CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  whatsapp_number   TEXT NOT NULL,
  email             TEXT NOT NULL,
  sugar_level       TEXT NOT NULL CHECK (sugar_level IN ('150-250','250+')),
  diabetes_duration TEXT NOT NULL CHECK (diabetes_duration IN ('new','mid','long','pre')),
  language_pref     TEXT NOT NULL CHECK (language_pref IN ('tamil','english')),
  lead_score        INTEGER NOT NULL CHECK (lead_score BETWEEN 1 AND 5),
  wa_clicked        BOOLEAN NOT NULL DEFAULT FALSE,
  utm_source        TEXT,
  utm_campaign      TEXT,
  utm_content       TEXT,
  fbclid            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Index for fast admin queries
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);

-- 4. Seed the initial config row
INSERT INTO webinar_config (id, next_webinar_at, tuesday_whatsapp_link, friday_whatsapp_link)
VALUES (1, NOW() + INTERVAL '4 days', '', '')
ON CONFLICT (id) DO NOTHING;
