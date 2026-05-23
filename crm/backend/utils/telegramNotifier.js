/*
 * telegramNotifier — push CRM events to Telegram chats.
 *
 * Recipients live in the `telegram_alert_recipients` table and are managed
 * by admins via the Alerts tab. Each row says either:
 *   target_type='team_leader' → forward events about callers reporting to
 *                               team_leader_id
 *   target_type='manager'     → forward events about callers in `department`
 *                               (NULL department = subscribe to all depts)
 *
 * Set TELEGRAM_BOT_TOKEN in .env. If it's missing every send becomes a
 * no-op + warning log — the CRM keeps working, alerts just don't deliver.
 *
 * All sends are fire-and-forget so a Telegram outage never blocks the
 * underlying CRM action (pause, resume, etc.).
 */
const pool = require('../db');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_API    = (method) => `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;

const ROLE_LABEL = {
  junior_caller: 'Junior Caller',
  senior_caller: 'Senior Caller',
  manager:       'Manager',
  trainer:       'Trainer',
  team_leader:   'Team Leader',
  admin:         'Admin',
};

const REASON_LABEL = {
  smartflow_cap_exceeded: 'SmartFlow retry cap exceeded — agent leg unanswered 5 times',
  'robot nudge ignored':  'Ignored repeated robot nudges',
  break_overrun:          'Break ran over the allowed window',
};
function prettyReason(r) {
  if (!r) return 'Auto-paused — no reason recorded';
  return REASON_LABEL[r] || r;
}

/* ──────────────────────────────────────────────────────────────────────
   Low-level send. Returns { ok, error? }. Never throws.
   ────────────────────────────────────────────────────────────────────── */
async function sendTelegram(chatId, text) {
  if (!BOT_TOKEN) {
    console.warn('[telegramNotifier] TELEGRAM_BOT_TOKEN missing — skipping send.');
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not set' };
  }
  if (!chatId) return { ok: false, error: 'chat_id missing' };

  try {
    const res = await fetch(TG_API('sendMessage'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    String(chatId),
        text:       text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const err = data.description || `Telegram API ${res.status}`;
      console.error('[telegramNotifier] sendTelegram failed:', err);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (err) {
    console.error('[telegramNotifier] sendTelegram threw:', err.message);
    return { ok: false, error: err.message };
  }
}

/* ──────────────────────────────────────────────────────────────────────
   Pick the recipient rows for an event about `caller` (a crm_users row).
   Returns the list of telegram_alert_recipients to push to.
   ────────────────────────────────────────────────────────────────────── */
async function recipientsForCaller(caller) {
  // SQL: any TL row whose team_leader_id equals THIS caller's team_leader_id,
  //      plus any manager row whose department matches the caller's
  //      department (or whose department is NULL = subscribes to everything).
  const { rows } = await pool.query(
    `SELECT id, telegram_chat_id, target_type, team_leader_id, department, label
       FROM telegram_alert_recipients
      WHERE (target_type = 'team_leader' AND team_leader_id = $1)
         OR (target_type = 'manager' AND (department = $2 OR department IS NULL))`,
    [caller.team_leader_id || null, caller.department || null]
  );
  return rows;
}

/* ──────────────────────────────────────────────────────────────────────
   Public: notify TLs + managers about an auto-pause event.
   Hooked from routes/caller.js at every UPDATE that sets auto_paused_at.
   ────────────────────────────────────────────────────────────────────── */
async function notifyAutoPause(callerId, reason) {
  try {
    // Pull the up-to-date crm_users row so we have full_name, role, dept,
    // and the team_leader_id needed to route the alert.
    const { rows } = await pool.query(
      `SELECT id, full_name, role, department, team_leader_id
         FROM crm_users
        WHERE id = $1`,
      [callerId]
    );
    const caller = rows[0];
    if (!caller) return;

    const recipients = await recipientsForCaller(caller);
    if (recipients.length === 0) return;

    const text = [
      `🛑 <b>Auto-pause alert</b>`,
      ``,
      `<b>${escapeHtml(caller.full_name)}</b> (${ROLE_LABEL[caller.role] || caller.role}) was auto-paused.`,
      `Department: ${caller.department || '—'}`,
      `Reason: ${escapeHtml(prettyReason(reason))}`,
      ``,
      `Resume from the CRM → Notifications tab.`,
    ].join('\n');

    // Fire-and-forget all sends in parallel.
    await Promise.all(recipients.map(r => sendTelegram(r.telegram_chat_id, text)));
  } catch (err) {
    console.error('[telegramNotifier] notifyAutoPause error:', err.message);
  }
}

/* Tiny HTML-escaper for Telegram's `parse_mode: HTML`. Keep this in sync
   with any new tag we use (b, i, code, etc.). */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  sendTelegram,
  notifyAutoPause,
  escapeHtml,
};
