/* Caller activity — single-tag model helpers.
   ===================================================================
   ONE channel: the caller workspace mirrors its current sub-state into
   localStorage[mhs_activity_<uid>]; CallerShell's heartbeat reads it,
   derives the SINGLE current tag (deriveCallerTag), and POSTs it to
   /api/caller/heartbeat. The backend `switchTag` keeps exactly one open
   activity span per caller — no overlapping / double tags.
   =================================================================== */

// Page-id → activity tag. Mirrors the PAGES array in CallerShell.jsx.
export const PAGE_TAG_BY_ID = {
  call:         'ON_PAGE_CALL',
  assigned:     'ON_PAGE_ASSIGNED',
  completed:    'ON_PAGE_COMPLETED',
  not_picked:   'ON_PAGE_NOT_PICKED',
  missed_calls: 'ON_PAGE_MISSED_CALLS',
  untouched:    'ON_PAGE_UNTOUCHED',
  next_batch:   'ON_PAGE_NEXT_BATCH',
};

/* localStorage key — derived from the caller's user_id in the JWT so every
   part of the workspace (CallerShell + every module) agrees on one key. */
export function activityKey(jwt) {
  try {
    const [, payload] = String(jwt || '').split('.');
    const uid = JSON.parse(atob(payload || ''))?.user_id;
    return uid ? `mhs_activity_${uid}` : 'mhs_activity_anon';
  } catch { return 'mhs_activity_anon'; }
}

const EMPTY = { status: 'idle', break: null, subTag: null, subContext: null };

export function readActivity(jwt) {
  try {
    const raw = localStorage.getItem(activityKey(jwt));
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw);
    return {
      status:     p?.status     || 'idle',
      break:      p?.break      || null,
      subTag:     p?.subTag     || null,
      subContext: p?.subContext || null,
    };
  } catch { return { ...EMPTY }; }
}

/* Merge-write `partial` into the activity object and notify CallerShell —
   the `mhs:activity:changed` event triggers an immediate heartbeat. */
function patchActivity(jwt, partial) {
  try {
    const next = { ...readActivity(jwt), ...partial, updatedAt: Date.now() };
    localStorage.setItem(activityKey(jwt), JSON.stringify(next));
  } catch { /* sandbox / quota */ }
  try { window.dispatchEvent(new Event('mhs:activity:changed')); } catch { /* no-op */ }
}

/* AssignedLeadsModule owns the coarse working / on_break / idle status that
   drives the admin Sales-Performance "Status" column. */
export function setActivityStatus(jwt, status, breakInfo) {
  if (!jwt) return;
  patchActivity(jwt, { status: status || 'idle', break: breakInfo || null });
}

/* Whichever component is in a sub-state (break, picker, call, form, editing)
   sets the sub-tag; it clears it (subTag = null) when that state ends or the
   component unmounts. Exactly one sub-state is ever active at a time. */
export function setActivitySub(jwt, subTag, subContext) {
  if (!jwt) return;
  patchActivity(jwt, { subTag: subTag || null, subContext: subContext || null });
}

/* The single current tag, by priority. Used by CallerShell's heartbeat. */
export function deriveCallerTag({ activePage, isActive, autoPausedAt, subTag }) {
  if (isActive === false) return autoPausedAt ? 'BLOCKED' : 'PAUSED_BY_ADMIN';
  if (subTag) return subTag;
  return PAGE_TAG_BY_ID[activePage] || 'ON_PAGE_CALL';
}

/* Deprecated no-op — POST /api/caller/state was removed in the single-tag
   redesign. Kept exported so any stale import can't throw. */
export async function emitCallerState() { /* no-op */ }
