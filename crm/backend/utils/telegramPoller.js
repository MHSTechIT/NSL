/*
 * telegramPoller — long-polling worker for incoming Telegram updates.
 *
 * Why long-polling (not webhooks): localhost dev needs to work without
 * a public HTTPS endpoint, and Render's free tier sleeps a public
 * webhook anyway. getUpdates with timeout=30 is one open HTTP connection
 * per ~30s and Telegram delivers events as they happen.
 *
 * Crash safety: last processed update_id is persisted in
 * telegram_poll_state (singleton row). Restarts resume from the next
 * update, never re-firing handlers.
 *
 * To opt out: set DISABLE_TELEGRAM_POLLER=true. The poller also no-ops
 * when TELEGRAM_BOT_TOKEN is unset.
 */
const pool = require('../db');
const { handleMessage, handleCallback } = require('./telegramResumeHandler');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_API    = (m) => `https://api.telegram.org/bot${BOT_TOKEN}/${m}`;
const POLL_TIMEOUT_S = 30;       // server-side long-poll window
const BACKOFF_MS     = 5000;     // on error: wait this long before retrying

let running = false;
let stopping = false;

async function getLastUpdateId() {
  try {
    const { rows } = await pool.query(
      `SELECT last_update_id FROM telegram_poll_state WHERE id = 1`
    );
    return Number(rows[0]?.last_update_id ?? 0);
  } catch (e) {
    console.error('[telegramPoller] getLastUpdateId failed:', e.message);
    return 0;
  }
}

async function setLastUpdateId(id) {
  try {
    await pool.query(
      `UPDATE telegram_poll_state SET last_update_id = $1, updated_at = NOW() WHERE id = 1`,
      [id]
    );
  } catch (e) {
    console.error('[telegramPoller] setLastUpdateId failed:', e.message);
  }
}

async function loop() {
  running = true;
  while (!stopping) {
    let nextOffset = (await getLastUpdateId()) + 1;
    try {
      const url = `${TG_API('getUpdates')}?offset=${nextOffset}&timeout=${POLL_TIMEOUT_S}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (!data.ok) {
        console.error('[telegramPoller] getUpdates not ok:', data.description || `HTTP ${res.status}`);
        await sleep(BACKOFF_MS);
        continue;
      }

      for (const update of (data.result || [])) {
        try {
          if (update.callback_query)      await handleCallback(update);
          else if (update.message)        await handleMessage(update);
          // Other update types (edited_message, channel_post, etc.) are
          // intentionally ignored — the bot only acts on direct messages
          // and button taps.
        } catch (err) {
          console.error('[telegramPoller] handler threw:', err.message);
        }
        // Persist progress AFTER the handler so a crash mid-handler will
        // re-deliver the update. Handlers are idempotent (resumeCaller
        // no-ops on already-active rows) so re-delivery is safe.
        await setLastUpdateId(update.update_id);
      }
    } catch (err) {
      console.error('[telegramPoller] loop error:', err.message);
      await sleep(BACKOFF_MS);
    }
  }
  running = false;
}

function start() {
  if (running) return;
  if (!BOT_TOKEN) {
    console.warn('[telegramPoller] TELEGRAM_BOT_TOKEN missing — poller not started.');
    return;
  }
  if (process.env.DISABLE_TELEGRAM_POLLER === 'true') {
    console.log('[telegramPoller] DISABLE_TELEGRAM_POLLER=true → not starting poller');
    return;
  }
  console.log('[telegramPoller] starting long-poll loop');
  loop().catch(e => console.error('[telegramPoller] fatal:', e.message));
}

function stop() { stopping = true; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { start, stop };
