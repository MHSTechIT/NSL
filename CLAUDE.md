# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

MHS (My Health School) — a diabetes reversal webinar registration funnel. Three independent Vite/React SPAs + a Node.js/Express backend + PostgreSQL. No monorepo tooling; each app has its own `package.json`.

---

## Dev Commands

### Backend
```bash
cd backend
npm run dev          # node index.js on port 3001
npm test             # Jest
```

### Frontend apps (each independent)
```bash
cd apps/funnel       && npm run dev    # port 5173 — main funnel + /admin
cd apps/whatsapp     && npm run dev    # port 5175 — post-submit WA redirect page
cd apps/disqualified && npm run dev    # port 5176 — disqualification screens

npm run build    # Vite production build (run inside each app dir)
```

### Access points (local)
| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Funnel landing |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:3001/api | Backend API |

---

## Architecture

### Apps
- **apps/funnel** — Multi-step registration funnel (Screen1A → Screen2 → Screen3/4 → Screen5/WhatsAppPage) plus the full admin panel under `/admin`
- **apps/whatsapp** — Standalone WhatsApp redirect, served at a separate domain in production
- **apps/disqualified** — Screens for users who don't qualify (wrong language, no diabetes)

All three frontends proxy `/api/*` to `localhost:3001` via `vite.config.js`. In production each app's API calls go to the Render backend domain.

### Backend (`backend/`)
Express app with five route files, all mounted in `app.js`:

| Mount | File | Auth |
|-------|------|------|
| `POST /api/leads`, `PATCH /api/leads/:id/wa-click` | routes/leads.js | public |
| `POST /api/events` | routes/events.js | public |
| `GET /api/webinar-config`, `GET /api/webinar-config/events` (SSE) | routes/webinarConfig.js | public |
| `POST /api/auth/*` | routes/auth.js | public |
| `GET\|PUT\|POST\|PATCH /api/admin/*` | routes/admin.js | Bearer token |

Admin auth is a plain-text password comparison (`crypto.timingSafeEqual`) stored in `.env` as `ADMIN_PASSWORD`.

### Database (PostgreSQL)

Schema source: `database/supabase_schema.sql`. Three tables:

- **webinar_config** — single row (`id=1`). Holds `next_webinar_at`, `tuesday_whatsapp_link`, `friday_whatsapp_link`, `kill_switch`, and two scheduled link-swap slots (`pending_whatsapp_link{,_2}` + `whatsapp_link_swap_at{,_2}`).
- **leads** — one row per registration. Key columns: `sugar_level` ('150-250'|'250+'), `diabetes_duration` ('new'|'mid'|'long'|'pre'), `language_pref`, `lead_score` (2–5), `wa_clicked` (bool), UTM params, `fbclid`.
- **click_events** — append-only button analytics (`event_name`, `webinar_at`, `created_at`). Auto-created by migration in `app.js` on cold start.

Auto-migrations run via `pool.query(...)` in `app.js` on every server start (idempotent `IF NOT EXISTS`). Follow this pattern for any new schema changes.

### State Management (funnel app)

`FunnelContext.jsx` — React Context + `useReducer`. Persisted to `localStorage`. Key fields: `lang`, `sugarLevel`, `diabetesDuration`, `fullName`, `email`, `whatsappNumber`, `submittedLeadId`, `webinarConfig`, UTM params.

The `webinarConfig` slice is kept live via SSE (`GET /api/webinar-config/events`). Admin updates broadcast to all connected clients immediately via `sseClients.broadcast()`.

### Key Business Logic

**Lead scoring** (`utils/scoring.js`):
```
pre-diabetic → 2
sugar 150-250 → base 2;  sugar 250+ → base 3
+ duration bonus: long +2, mid +1, new +0
capped at 5
```

**WhatsApp link selection** (in `routes/leads.js`): IST day-of-week — Mon/Tue uses `tuesday_whatsapp_link`, all other days use `friday_whatsapp_link`.

**Link swap scheduler** (`utils/linkSwapScheduler.js`): runs every 30 s. Also executes on every `GET /api/webinar-config` as a fallback (Render sleep resilience).

**Button click tracking** (`utils/trackEvent.js` → `POST /api/events`): fire-and-forget from each screen. Valid `event_name` values are whitelisted in `routes/events.js`. Always pass `state.webinarConfig?.next_webinar_at` as `webinar_at`.

**WA click tracking**: `handleJoinClick` in `WhatsAppPage.jsx` reads `mhs_lead_id` from `localStorage` (set in `Screen4.jsx` before redirect) and calls `PATCH /api/leads/:id/wa-click`.

### Admin Dashboard (`apps/funnel/src/admin/`)

| Component | Tab |
|-----------|-----|
| HomeDashboard.jsx | Home Dashboard (default) |
| LeadsTable.jsx | Leads |
| WhatsAppLinksEditor.jsx | WhatsApp Links |
| TimerConfig.jsx | Timer & Controls |

`AdminPage.jsx` manages tab state and passes `token` (from `sessionStorage`) down to each panel.

---

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=
ADMIN_PASSWORD=
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
GMAIL_FROM=
GMAIL_APP_PASSWORD=
RESET_EMAIL_TO=
GOOGLE_SERVICE_ACCOUNT_JSON=   # optional — Google Sheets sync
GOOGLE_SHEET_ID=               # optional
```

### Frontend
No `.env` needed in dev (Vite proxy handles `/api`). In production set `VITE_WHATSAPP_URL` and `VITE_DISQUALIFIED_URL` to the deployed app domains.

---

## Deployment

- **Backend** → Render (`render.yaml`): `node index.js`, port 3001. All env vars set in Render dashboard.
- **Frontend apps** → Vercel. Each app deployed independently from its subdirectory. Project IDs stored in `apps/*/. vercel/project.json`.
- Deploy frontend: `cd apps/funnel && vercel --prod`
- Backend auto-migrates tables on cold start — no manual SQL needed after deploys.
