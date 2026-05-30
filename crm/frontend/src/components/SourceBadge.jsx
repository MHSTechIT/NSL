/* Source badge — small colored pill that sits next to a lead name to show
   which funnel the lead came from (META or YT). Shared across every lead
   list view + lead detail modal so the source is always obvious at a glance.

   `source` is the raw 'meta' | 'yt' value from the leads table. Unknown
   sources render nothing (defensive — never break a row layout). */
const META  = { label: 'META',   bg: '#E0E7FF', fg: '#1E40AF', border: 'rgba(30,64,175,0.20)' };
const YT    = { label: 'YT',     bg: '#FEE2E2', fg: '#B91C1C', border: 'rgba(185,28,28,0.22)' };
const META2 = { label: 'META 2', bg: '#DCFCE7', fg: '#15803D', border: 'rgba(21,128,61,0.22)' };

export default function SourceBadge({ source, style }) {
  if (source !== 'meta' && source !== 'yt' && source !== 'meta2') return null;
  const m = source === 'yt' ? YT : source === 'meta2' ? META2 : META;
  return (
    <span
      title={`Lead source: ${m.label}`}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '1px 7px',
        borderRadius: 999,
        fontFamily: 'Outfit, sans-serif',
        fontSize: '0.62rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        background: m.bg,
        color: m.fg,
        border: `1px solid ${m.border}`,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {m.label}
    </span>
  );
}
