/**
 * Fire-and-forget button click tracker.
 * Sends a POST to /api/events. Never throws — a missed event is
 * better than a broken funnel experience.
 *
 * @param {string} eventName  - one of the VALID_EVENTS keys defined in backend/routes/events.js
 * @param {string|null} webinarAt - ISO string of the upcoming webinar (state.webinarConfig?.next_webinar_at)
 */
export function trackEvent(eventName, webinarAt) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_name: eventName, webinar_at: webinarAt ?? null }),
  }).catch(() => {}); // intentionally silent — never block the user
}
