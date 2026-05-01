import { useEffect, useState, useCallback } from 'react';

const DURATION_LABELS = { new: '< 1 yr', mid: '1–5 yrs', long: '5+ yrs', pre: 'Pre-diabetic' };
const SUGAR_LABELS    = { '150-250': '150–250', '250+': '250+' };

export default function LeadsTable({ token }) {
  const [leads, setLeads]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [sortKey, setSortKey]       = useState('created_at');
  const [sortAsc, setSortAsc]       = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [syncToast, setSyncToast]   = useState(null);

  // Delete mode state
  const [deleteMode, setDeleteMode]     = useState(false);
  const [selected, setSelected]         = useState(new Set());
  const [deleting, setDeleting]         = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);

  function loadLeads() {
    setLoading(true);
    fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLeads(); }, [token]);

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = leads.filter(l => {
    if (dateFrom || dateTo) {
      const created = new Date(l.created_at);
      if (dateFrom && created < new Date(dateFrom + 'T00:00:00+05:30')) return false;
      if (dateTo   && created > new Date(dateTo   + 'T23:59:59+05:30')) return false;
    }
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

  // ── Delete helpers ──
  function toggleDeleteMode() {
    setDeleteMode(v => !v);
    setSelected(new Set());
    setConfirmOpen(false);
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map(l => l.id)));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncToast({ ok: true, msg: `✓ ${data.deleted} lead${data.deleted !== 1 ? 's' : ''} permanently deleted.` });
        setDeleteMode(false);
        setSelected(new Set());
        setConfirmOpen(false);
        loadLeads();
      } else {
        setSyncToast({ ok: false, msg: data.error || 'Delete failed.' });
      }
    } catch {
      setSyncToast({ ok: false, msg: 'Network error. Try again.' });
    } finally {
      setDeleting(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  }

  const dateFiltered = leads.filter(l => {
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom + 'T00:00:00+05:30')) return false;
    if (dateTo   && new Date(l.created_at) > new Date(dateTo   + 'T23:59:59+05:30')) return false;
    return true;
  });
  const waClicked    = dateFiltered.filter(l => l.wa_clicked === true).length;
  const waNotClicked = dateFiltered.filter(l => !l.wa_clicked).length;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* Delete mode toggle */}
          {!deleteMode ? (
            <button
              onClick={toggleDeleteMode}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: '2.4rem', padding: '0 16px', borderRadius: 50,
                border: '1.5px solid rgba(220,38,38,0.35)',
                background: 'rgba(254,242,242,0.80)',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.82rem',
                color: '#DC2626', cursor: 'pointer', transition: 'all 180ms',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          ) : (
            <button
              onClick={toggleDeleteMode}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: '2.4rem', padding: '0 16px', borderRadius: 50,
                border: '1.5px solid rgba(139,92,246,0.30)',
                background: 'rgba(237,234,248,0.80)',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.82rem',
                color: '#5B21B6', cursor: 'pointer',
              }}
            >
              ✕ Cancel
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-purple text-white font-sans font-semibold text-sm px-4 py-2.5 rounded-pill hover:bg-purple-700 transition-colors shadow-[0_2px_12px_rgba(91,33,182,0.25)]"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Delete action bar — shown when in delete mode */}
      {deleteMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(254,242,242,0.90)', borderRadius: 12,
          border: '1.5px solid rgba(220,38,38,0.25)',
          padding: '10px 16px', marginBottom: 14,
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={sorted.length > 0 && selected.size === sorted.length}
              onChange={toggleSelectAll}
              style={{ width: 16, height: 16, accentColor: '#DC2626', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.83rem', fontWeight: 600, color: '#DC2626' }}>
              {selected.size === 0
                ? 'Select leads to delete'
                : `${selected.size} lead${selected.size !== 1 ? 's' : ''} selected`}
            </span>
          </div>
          {selected.size > 0 && (
            <button
              onClick={() => setConfirmOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: '2.2rem', padding: '0 18px', borderRadius: 50,
                border: 'none', background: '#DC2626',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.83rem',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(220,38,38,0.30)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              Delete {selected.size} Selected
            </button>
          )}
        </div>
      )}

      {/* Toast */}
      {syncToast && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 10,
          background: syncToast.ok ? 'rgba(220,252,231,0.80)' : 'rgba(254,226,226,0.80)',
          border: syncToast.ok ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)',
          fontFamily: 'Outfit, sans-serif', fontSize: '0.83rem', fontWeight: 600,
          color: syncToast.ok ? '#15803d' : '#DC2626',
        }}>
          {syncToast.msg}
        </div>
      )}

      {/* Date range filter */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: 'rgba(237,234,248,0.50)', borderRadius: 14,
        border: '1px solid rgba(139,92,246,0.15)',
        padding: '10px 14px', marginBottom: 14,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(91,33,182,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(91,33,182,0.65)', whiteSpace: 'nowrap' }}>Date Range</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ height: '2.1rem', padding: '0 10px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)', background: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#3B0764', outline: 'none', cursor: 'pointer' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', color: 'rgba(91,33,182,0.45)', fontWeight: 600 }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ height: '2.1rem', padding: '0 10px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)', background: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', color: '#3B0764', outline: 'none', cursor: 'pointer' }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ height: '2.1rem', padding: '0 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.30)', background: 'rgba(254,242,242,0.80)', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: '#DC2626', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Leads',       value: dateFiltered.length,                                          filterId: 'all',        color: 'text-purple-700 bg-purple-50', ring: 'ring-purple-400' },
          { label: 'High Sugar (250+)', value: dateFiltered.filter(l => l.sugar_level === '250+').length,   filterId: 'high_sugar', color: 'text-red-700 bg-red-50',       ring: 'ring-red-400' },
          { label: 'WA Clicked',        value: waClicked,                                                   filterId: 'wa_clicked', color: 'text-green-700 bg-green-50',    ring: 'ring-green-400' },
          { label: 'WA Not Clicked',    value: waNotClicked,                                                filterId: 'wa_not',     color: 'text-gray-600 bg-gray-50',      ring: 'ring-gray-400' },
        ].map((s, i) => {
          const isActive = activeFilter === s.filterId;
          return (
            <button key={i} onClick={() => setActiveFilter(isActive ? 'all' : s.filterId)}
              className={`rounded-card px-4 py-3 text-left border transition-all duration-150 w-full ${s.color} border-current/10 ${isActive ? `ring-2 ${s.ring} scale-[1.03] shadow-md` : 'hover:scale-[1.02] hover:shadow-sm'}`}
              style={{ cursor: 'pointer' }}>
              <p className="font-sans font-bold text-2xl">{s.value}</p>
              <p className="font-sans text-xs mt-0.5 opacity-80">{s.label}</p>
              {isActive && <p className="font-sans text-[10px] font-semibold mt-1 opacity-60 uppercase tracking-wide">● Filtered</p>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-purple-100">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-purple-100 bg-purple-50/60">
              {/* Checkbox column header */}
              {deleteMode && (
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selected.size === sorted.length}
                    onChange={toggleSelectAll}
                    style={{ width: 15, height: 15, accentColor: '#DC2626', cursor: 'pointer' }}
                  />
                </th>
              )}
              {cols.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)}
                  className="px-3 py-3 text-left text-xs font-semibold text-purple-500 cursor-pointer hover:text-purple whitespace-nowrap select-none transition-colors">
                  {c.label} {sortKey === c.key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, idx) => (
              <tr
                key={l.id}
                onClick={() => deleteMode && toggleSelect(l.id)}
                className={`border-b border-purple-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-purple-50/20'}
                  ${deleteMode ? 'cursor-pointer' : ''}
                  ${deleteMode && selected.has(l.id) ? 'bg-red-50/60' : 'hover:bg-lavender/40'}
                `}
              >
                {/* Checkbox cell */}
                {deleteMode && (
                  <td className="px-3 py-3" onClick={e => { e.stopPropagation(); toggleSelect(l.id); }}>
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggleSelect(l.id)}
                      style={{ width: 15, height: 15, accentColor: '#DC2626', cursor: 'pointer' }}
                    />
                  </td>
                )}
                <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{l.full_name}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">+91 {l.whatsapp_number}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-semibold ${l.sugar_level === '250+' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {SUGAR_LABELS[l.sugar_level] || l.sugar_level}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{DURATION_LABELS[l.diabetes_duration] || l.diabetes_duration}</td>
                <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">
                  {new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {l.wa_clicked
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-semibold bg-green-100 text-green-700">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Clicked
                      </span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium bg-gray-100 text-gray-400">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', display: 'inline-block' }} />
                        Not yet
                      </span>
                  }
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={deleteMode ? 7 : 6} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-purple-300">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                    <p className="font-sans text-sm">No leads yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setConfirmOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(15,0,40,0.50)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 380,
            background: '#fff', borderRadius: 20,
            border: '1px solid rgba(220,38,38,0.20)',
            boxShadow: '0 24px 64px rgba(220,38,38,0.18)',
            padding: '32px 28px 28px',
            fontFamily: 'Outfit, sans-serif',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(254,226,226,0.80)', border: '1.5px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#3B0764', margin: '0 0 8px' }}>
              Delete {selected.size} Lead{selected.size !== 1 ? 's' : ''}?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
              This action is <strong style={{ color: '#DC2626' }}>permanent</strong> and cannot be undone. The selected leads will be removed from the database forever.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{ flex: 1, height: '2.7rem', borderRadius: 50, border: '1px solid rgba(209,196,240,0.8)', background: 'rgba(237,234,248,0.50)', fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#5B21B6', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, height: '2.7rem', borderRadius: 50, border: 'none', background: deleting ? 'rgba(220,38,38,0.55)' : '#DC2626', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(220,38,38,0.30)' }}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
