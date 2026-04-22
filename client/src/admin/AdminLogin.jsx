import { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  /* forgot-password state */
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSent, setFpSent]       = useState(false);
  const [fpError, setFpError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leads', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        sessionStorage.setItem('mhs_admin_token', password);
        onLogin(password);
      } else if (res.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(`Server error (${res.status}). Try again.`);
      }
    } catch {
      setError('Cannot reach server. Make sure the server is running.');
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setFpLoading(true);
    setFpError('');
    try {
      const res  = await fetch('/api/auth/forgot-password', { method: 'POST' });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }
      if (!res.ok) {
        setFpError(data.error || `Server error (${res.status}). Check server logs.`);
      } else {
        setFpSent(true);
      }
    } catch {
      setFpError('Cannot reach server. Is it running?');
    }
    setFpLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ maxWidth: 'none', background: '#EDEAF8' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#5B21B6,#8B6FEA)' }}
          >
            <span className="font-sans font-bold text-white text-2xl">M</span>
          </div>
          <h1 className="font-sans text-3xl font-bold text-purple-900">MHS Admin</h1>
          <p className="font-sans text-sm text-purple-400 mt-1">My Health School · Lead Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="font-sans font-semibold text-gray-700 mb-4 text-sm">Sign in to continue</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Password field with show/hide */}
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                className="field-input"
                style={{ paddingRight: '2.8rem' }}
                autoFocus
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(91,33,182,0.40)', padding: 4,
                }}
              >
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 font-sans text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary"
            >
              {loading
                ? <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Verifying...
                  </span>
                : 'Sign In →'}
            </button>
          </form>

          {/* ── Forgot password section ── */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(209,196,240,0.45)' }}>
            {fpSent ? (
              /* Success state */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'rgba(237,234,248,0.55)', borderRadius: 12, padding: '14px 16px',
                border: '1px solid rgba(147,51,234,0.15)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#5B21B6,#9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <p style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#3B0764', margin: 0 }}>
                  Reset link sent!
                </p>
                <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.75rem', color: 'rgba(91,33,182,0.55)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                  Check <strong>marketing.integfarms@gmail.com</strong> for the password reset link.
                </p>
                <button
                  onClick={() => { setFpSent(false); setFpError(''); }}
                  style={{ marginTop: 4, fontFamily: 'Outfit,sans-serif', fontSize: '0.75rem', color: 'rgba(91,33,182,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Send again
                </button>
              </div>
            ) : (
              /* Link + optional error */
              <div style={{ textAlign: 'center' }}>
                {fpError && (
                  <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.75rem', color: '#EF4444', marginBottom: 8 }}>
                    ⚠ {fpError}
                  </p>
                )}
                <button
                  onClick={handleForgotPassword}
                  disabled={fpLoading}
                  style={{
                    background: 'none', border: 'none', cursor: fpLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit,sans-serif', fontSize: '0.82rem', fontWeight: 600,
                    color: fpLoading ? 'rgba(91,33,182,0.35)' : '#5B21B6',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    textDecoration: 'none',
                    padding: 0,
                  }}
                >
                  {fpLoading && (
                    <svg style={{ animation: 'spin 1s linear infinite', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {fpLoading ? 'Sending reset link...' : 'Forgot password?'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
