import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI, scansAPI } from '../api/api'

const RISK_COLOR = {
  LOW: '#22d3a0', MEDIUM: '#f97316', HIGH: '#ff4d6d', CRITICAL: '#ff1e50'
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([authAPI.me(), scansAPI.list()])
      .then(([u, s]) => { setUser(u.data); setScans(s.data) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    try { await authAPI.logout() } catch (_) {}
    localStorage.removeItem('sentinel_token')
    window.location.href = '/login?from=logout'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a855f7', fontSize: '14px' }}>Loading...</div>
    </div>
  )

  const totalScans = scans.length
  const completed = scans.filter(s => s.status === 'complete').length
  const highRisk = scans.filter(s => ['HIGH', 'CRITICAL'].includes(s.risk_label)).length
  const clean = scans.filter(s => s.risk_label === 'LOW').length
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eaff', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .nav-link { color: rgba(240,234,255,0.5); text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .nav-link:hover { color: #c084fc; }
        .nav-link.active { color: #c084fc; }
        .stat-card:hover { border-color: rgba(138,43,226,0.4) !important; transform: translateY(-2px); }
        .stat-card { transition: all 0.25s; }
        .logout-btn:hover { color: #f0eaff !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 6px; }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,0,200,.2) 0%,transparent 70%)', top: -150, left: -100, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(138,43,226,.12) 0%,transparent 70%)', bottom: '10%', right: -100, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 60, background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(138,43,226,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#8a2be2,#bf5fff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>SentinelAI</span>
          <span style={{ marginLeft: 8, padding: '2px 10px', background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)', borderRadius: 4, fontSize: 11, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>PROFILE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/profile" className="nav-link active">Profile</Link>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(138,43,226,0.4)' }} />
              <span style={{ fontSize: 13, color: 'rgba(240,234,255,0.7)' }}>{user.github_username}</span>
            </div>
          )}
          <button className="logout-btn" onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(240,234,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.2s' }}>logout →</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 8 }}>// User Profile</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
            Your <span style={{ background: 'linear-gradient(135deg,#c084fc,#7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Account.</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Profile card */}
          <div style={{ background: 'rgba(17,17,36,0.8)', border: '1px solid rgba(138,43,226,0.25)', borderRadius: 20, padding: '2rem', backdropFilter: 'blur(10px)' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(138,43,226,0.15)', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <img
                  src={user?.avatar_url}
                  alt={user?.github_username}
                  style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid rgba(138,43,226,0.5)', boxShadow: '0 0 32px rgba(138,43,226,0.35)' }}
                />
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#22d3a0', border: '2px solid #080810', boxShadow: '0 0 8px rgba(34,211,160,0.6)' }} />
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {user?.github_username}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(240,234,255,0.45)', fontFamily: 'JetBrains Mono, monospace' }}>
                {user?.email || 'No public email'}
              </div>
            </div>

            {/* Details */}
            {[
              { label: 'Member Since', value: memberSince, icon: '📅' },
              { label: 'GitHub ID', value: `#${user?.id?.slice(0, 8)}...`, icon: '🔑' },
              { label: 'Auth Provider', value: 'GitHub OAuth', icon: '🐙' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 0', borderBottom: '1px solid rgba(138,43,226,0.08)' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'rgba(240,234,255,0.35)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(240,234,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                </div>
              </div>
            ))}

            <a
              href={`https://github.com/${user?.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1.5rem', padding: '0.65rem', background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.25)', borderRadius: 10, color: '#c084fc', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.2)'; e.currentTarget.style.borderColor = 'rgba(138,43,226,0.5)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(138,43,226,0.1)'; e.currentTarget.style.borderColor = 'rgba(138,43,226,0.25)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              View on GitHub →
            </a>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Total Scans', value: totalScans, color: '#a855f7' },
                { label: 'Completed', value: completed, color: '#22d3a0' },
                { label: 'High Risk', value: highRisk, color: '#ff4d6d' },
                { label: 'Clean', value: clean, color: '#22d3a0' },
              ].map(stat => (
                <div key={stat.label} className="stat-card" style={{ background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 14, padding: '1.2rem' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(240,234,255,0.4)', marginTop: 5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Risk distribution */}
            {completed > 0 && (
              <div style={{ background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 16, padding: '1.5rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '1rem' }}>// Risk Distribution</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(label => {
                    const count = scans.filter(s => s.risk_label === label).length
                    const pct = completed > 0 ? Math.round((count / completed) * 100) : 0
                    return (
                      <div key={label} style={{ flex: '1 1 100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: RISK_COLOR[label], fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(240,234,255,0.4)' }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: RISK_COLOR[label], borderRadius: 100, transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent scans */}
            <div style={{ background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(138,43,226,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: '#8b5cf6', textTransform: 'uppercase' }}>// Recent Scans</span>
                <Link to="/dashboard" style={{ fontSize: 11, color: '#8b5cf6', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>View all →</Link>
              </div>
              {scans.slice(0, 5).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(240,234,255,0.3)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>No scans yet</div>
              ) : (
                scans.slice(0, 5).map(scan => (
                  <div
                    key={scan.scan_id}
                    onClick={() => scan.status === 'complete' && navigate(`/scans/${scan.scan_id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(138,43,226,0.06)', cursor: scan.status === 'complete' ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    onMouseOver={e => { if (scan.status === 'complete') e.currentTarget.style.background = 'rgba(138,43,226,0.08)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#e9d5ff' }}>{scan.target}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,234,255,0.3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {scan.risk_label ? (
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, background: `${RISK_COLOR[scan.risk_label]}18`, color: RISK_COLOR[scan.risk_label], border: `1px solid ${RISK_COLOR[scan.risk_label]}33` }}>
                        {scan.risk_score} · {scan.risk_label}
                      </span>
                    ) : (
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.06)', color: 'rgba(240,234,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {scan.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
