import { useEffect, useState } from 'react';

const DURATION_LABELS = { new: '< 1 yr', mid: '1–5 yrs', long: '5+ yrs', pre: 'Pre-diabetic' };
const SUGAR_LABELS    = { '150-250': '150–250', '250+': '250+' };

export default function LeadsTable({ token }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [token]);

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = leads.filter(l => {
    if (activeFilter === 'all')        return true;
    if (activeFilter === 'high_sugar') return l.sugar_level === '250+';
    if (activeFilter === 'wa_clicked') return l.wa_clicked === true;
    if (activeFilter === 'wa_not')     return !l.wa_clicked;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? '';
    const vb = b[sortKey] ?? '';
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  function exportCSV() {
    const headers = ['Name', 'Phone', 'Sugar Level', 'Duration', 'Registered At', 'WA Clicked'];
    const rows = sorted.map(l => [
      l.full_name,
      '+91' + l.whatsapp_number,
      SUGAR_LABELS[l.sugar_level] || l.sugar_level,
      DURATION_LABELS[l.diabetes_duration] || l.diabetes_duration,
      new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      l.wa_clicked ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mhs_leads.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const waClicked    = leads.filter(l => l.wa_clicked === true).length;
  const waNotClicked = leads.filter(l => !l.wa_clicked).length;

  const cols = [
    { key: 'full_name',         label: 'Name' },
    { key: 'whatsapp_number',   label: 'Phone' },
    { key: 'sugar_level',       label: 'Sugar Level' },
    { key: 'diabetes_duration', label: 'Duration' },
    { key: 'created_at',        label: 'Registered' },
    { key: 'wa_clicked',        label: 'WhatsApp' },
  ];

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center gap-2 text-purple-400 font-sans text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading leads...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-sans text-xl font-bold text-purple-900">Lead Registry</h3>
          <p className="font-sans text-sm text-purple-400 mt-0.5">
            {activeFilter === 'all'
              ? <><span className="font-semibold text-purple-700">{total}</span> total registrations</>
              : <><span className="font-semibold text-purple-700">{sorted.length}</span> of {total} shown &mdash; <button onClick={() => setActiveFilter('all')} className="text-purple-500 underline font-semibold">Clear filter</button></>
            }
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 bg-purple text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-pill hover:bg-purple-700 transition-colors shadow-[0_2px_12px_rgba(91,33,182,0.25)]"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Stats summary — click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Leads',      value: total,                                               filterId: 'all',        color: 'text-purple-700 bg-purple-50', ring: 'ring-purple-400' },
          { label: 'High Sugar (250+)', value: leads.filter(l => l.sugar_level === '250+').length,  filterId: 'high_sugar', color: 'text-red-700 bg-red-50',       ring: 'ring-red-400' },
          { label: 'WA Clicked',        value: waClicked,                                           filterId: 'wa_clicked', color: 'text-green-700 bg-green-50',    ring: 'ring-green-400' },
          { label: 'WA Not Clicked',    value: waNotClicked,                                        filterId: 'wa_not',     color: 'text-gray-600 bg-gray-50',      ring: 'ring-gray-400' },
        ].map((s, i) => {
          const isActive = activeFilter === s.filterId;
          return (
            <button
              key={i}
              onClick={() => setActiveFilter(isActive ? 'all' : s.filterId)}
              className={`rounded-card px-4 py-3 text-left border transition-all duration-150 w-full
                ${s.color} border-current/10
                ${isActive ? `ring-2 ${s.ring} scale-[1.03] shadow-md` : 'hover:scale-[1.02] hover:shadow-sm'}
              `}
              style={{ cursor: 'pointer' }}
            >
              <p className="font-sans font-bold text-2xl">{s.value}</p>
              <p className="font-sans text-xs mt-0.5 opacity-80">{s.label}</p>
              {isActive && (
                <p className="font-sans text-[10px] font-semibold mt-1 opacity-60 uppercase tracking-wide">● Filtered</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-purple-100">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-purple-100 bg-purple-50/60">
              {cols.map(c => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className="px-3 py-3 text-left text-xs font-semibold text-purple-500 cursor-pointer hover:text-purple whitespace-nowrap select-none transition-colors"
                >
                  {c.label} {sortKey === c.key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, idx) => (
              <tr key={l.id} className={`border-b border-purple-50 hover:bg-lavender/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-purple-50/20'}`}>
                {/* Name */}
                <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{l.full_name}</td>

                {/* Phone */}
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">+91 {l.whatsapp_number}</td>

                {/* Sugar Level */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-semibold ${l.sugar_level === '250+' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {SUGAR_LABELS[l.sugar_level] || l.sugar_level}
                  </span>
                </td>

                {/* Duration */}
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {DURATION_LABELS[l.diabetes_duration] || l.diabetes_duration}
                </td>

                {/* Registered */}
                <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">
                  {new Date(l.created_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>

                {/* WA Clicked */}
                <td className="px-3 py-3 whitespace-nowrap">
                  {l.wa_clicked
                    ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-semibold bg-green-100 text-green-700">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Clicked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium bg-gray-100 text-gray-400">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', display: 'inline-block' }} />
                        Not yet
                      </span>
                    )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-purple-300">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-200"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                    <p className="font-sans text-sm">No leads yet. Share the funnel link to start collecting!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
