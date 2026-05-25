/* Lead tag classifier — HOT / WARM / COLD / JUNK.
 *
 * Mirrors the scoring rubric. The Q8 "Other Languages" and Q11
 * "Already Paid" questions were removed from the call form earlier,
 * so neither field is collected anymore — both have been DROPPED
 * from JUNK/HOT/WARM criteria here. Keeping them as required gates
 * meant HOT and WARM hard-criteria paths could never match (the
 * caller passes undefined for alreadyPaid → isNo() returns false),
 * so every saved lead ended up as COLD unless nextBatchJoining=yes
 * forced instant-HOT.
 *
 *   ── JUNK (forces, beats everything else) ──────────────────────────
 *   • Confirm Range = "No Diabetes"
 *   • Outcome subtag set by caller (handled by LeadCallNoteModal,
 *     not this function — subtag presence in callOnSaved overrides
 *     the classifier output to JUNK)
 *
 *   ── Instant HOT (rule 5) ──────────────────────────────────────────
 *   • Next Batch Joining = YES   →  HOT regardless of other fields
 *
 *   ── HOT (hard criteria) ───────────────────────────────────────────
 *   • Confirm Range = 250+
 *   • HbA1c > 7.5
 *   • Medicine = YES
 *   • Webinar Attended = YES  OR  Available for Webinar = YES
 *
 *   ── WARM (hard criteria) ──────────────────────────────────────────
 *   • Confirm Range = 200–250
 *   • HbA1c = 6.5 – 7.5
 *   • Webinar Attended = YES  OR  Available for Webinar = YES
 *     OR (Patient Age 25–54  AND  Working Professional in
 *          {Business, IT, Government, Private})
 *
 *   ── COLD ──────────────────────────────────────────────────────────
 *   Anything that survived the JUNK filter and didn't qualify for
 *   HOT / WARM lands here.
 *
 * The input is the same field shape the LeadCallNoteModal collects via
 * its useState hooks (string values, lowercase-underscored). Empty
 * strings = unanswered. `null` is returned only when there's literally
 * nothing useful filled in yet — caller can render a neutral
 * "Not classified" badge in that case.
 */

const WARM_AGE_BUCKETS = new Set(['25-34', '35-44', '45-54']);
const WARM_PROFS       = new Set(['business', 'it', 'government', 'private']);

function isYes(v) { return String(v || '').trim().toLowerCase() === 'yes'; }

/** Returns 'HOT' | 'WARM' | 'COLD' | 'JUNK' | null. */
export function classifyLeadTag(fields = {}) {
  const {
    confirmedRange,
    hba1c,
    takesMedicine,
    webinarAttended,
    availableForWebinar,
    nextBatchJoining,
    patientAge,
    workingProfessional,
  } = fields;

  // ── Bail out when nothing is filled — caller renders "—". ───────────
  const allEmpty = !confirmedRange && !hba1c
    && !takesMedicine && !webinarAttended
    && !availableForWebinar && !nextBatchJoining && !patientAge
    && !workingProfessional;
  if (allEmpty) return null;

  // ── JUNK (single field that forces JUNK on its own) ─────────────────
  // Other subtag-driven JUNK classifications happen in callOnSaved,
  // which overrides whatever this function returns when a subtag is
  // present.
  if (confirmedRange === 'no_diabetes') return 'JUNK';

  // ── Instant HOT (rule 5) ────────────────────────────────────────────
  if (isYes(nextBatchJoining)) return 'HOT';

  // ── HOT hard criteria ───────────────────────────────────────────────
  const hot = confirmedRange === '250+'
    && hba1c === 'gt_7_5'
    && isYes(takesMedicine)
    && (isYes(webinarAttended) || isYes(availableForWebinar));
  if (hot) return 'HOT';

  // ── WARM hard criteria ──────────────────────────────────────────────
  const warmBase = confirmedRange === '200-250'
    && hba1c === '6_5_to_7_5';
  const warmSoft = isYes(webinarAttended)
    || isYes(availableForWebinar)
    || (WARM_AGE_BUCKETS.has(patientAge) && WARM_PROFS.has(workingProfessional));
  if (warmBase && warmSoft) return 'WARM';

  // ── COLD (fallback for anything not forced to JUNK / qualifying HOT or WARM) ─
  return 'COLD';
}

/** Visual presentation tokens for each tag. Used by LeadTagBadge. */
export const TAG_STYLES = {
  HOT:  { bg: 'rgba(220,38,38,0.12)',  fg: '#B91C1C', dot: '#DC2626', icon: '🔥', label: 'HOT'  },
  WARM: { bg: 'rgba(245,158,11,0.16)', fg: '#B45309', dot: '#F59E0B', icon: '🟡', label: 'WARM' },
  COLD: { bg: 'rgba(59,130,246,0.14)', fg: '#1D4ED8', dot: '#3B82F6', icon: '🔵', label: 'COLD' },
  JUNK: { bg: 'rgba(107,114,128,0.18)', fg: '#374151', dot: '#6B7280', icon: '⛔', label: 'JUNK' },
};
