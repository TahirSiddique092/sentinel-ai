import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { scansAPI, authAPI } from '../api/api'
import api from '../api/api'

const RISK_COLOR = {
  LOW: '#22d3a0', MEDIUM: '#f97316', HIGH: '#ff4d6d', CRITICAL: '#ff1e50'
}
const RISK_BG = {
  LOW: 'rgba(34,211,160,0.12)', MEDIUM: 'rgba(249,115,22,0.12)',
  HIGH: 'rgba(255,77,109,0.12)', CRITICAL: 'rgba(255,30,80,0.15)'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scans, setScans] = useState([])
  const [model, setModel] = useState('')
  const [hfToken, setHfToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pollId, setPollId] = useState(null)

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

  const startScan = async () => {
    if (!model.trim()) return
    setError('')
    setScanning(true)
    try {
      const res = await api.post('/scans', {
        target: model.trim(),
        target_type: model.trim().startsWith('/') ? 'local' : 'huggingface',
        hf_token: hfToken || null
      })
      const scanId = res.data.scan_id
      const newScan = { scan_id: scanId, target: model.trim(), status: 'pending',
                        risk_score: null, risk_label: null, created_at: new Date().toISOString() }
      setScans(prev => [newScan, ...prev])
      setModel('')

      const interval = setInterval(async () => {
        try {
          const poll = await scansAPI.get(scanId)
          setScans(prev => prev.map(s => s.scan_id === scanId ? { ...s, ...poll.data } : s))
          if (['complete', 'failed'].includes(poll.data.status)) {
            clearInterval(interval)
            setScanning(false)
          }
        } catch { clearInterval(interval); setScanning(false) }
      }, 2500)
      setPollId(interval)
    } catch (e) {
      const msg = e.response?.data?.detail
      const status = e.response?.status
      if (status === 404) {
        setError(msg || 'Model not found on HuggingFace. Check the model ID.')
      } else if (status === 503) {
        setError(msg || 'Could not reach HuggingFace. Check your connection.')
      } else if (status === 429) {
        setError('Too many scans. Wait a moment and try again.')
      } else {
        setError(msg || 'Failed to start scan.')
      }
      setScanning(false)
    }
  }

  const fmt = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a855f7', fontSize: '14px' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eaff', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .scan-row:hover { background: rgba(138,43,226,0.08) !important; }
        .scan-row { transition: background 0.2s; cursor: pointer; }
        input:focus { outline: none; border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
        .btn-scan:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 32px rgba(138,43,226,0.6) !important; }
        .btn-scan:disabled { opacity: 0.5; cursor: not-allowed; }
        .logout-btn:hover { color: #f0eaff !important; }
        .nav-link { color: rgba(240,234,255,0.5); text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .nav-link:hover { color: #c084fc; }
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
          <span style={{ marginLeft: 8, padding: '2px 10px', background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)', borderRadius: 4, fontSize: 11, color: '#c084fc', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>DASHBOARD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/profile" className="nav-link">Profile</Link>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(138,43,226,0.4)', cursor: 'pointer' }} onClick={() => navigate('/profile')} />
              <span style={{ fontSize: 13, color: 'rgba(240,234,255,0.7)', cursor: 'pointer' }} onClick={() => navigate('/profile')}>{user.github_username}</span>
            </div>
          )}
          <button className="logout-btn" onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(240,234,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.2s' }}>logout →</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 8 }}>// AI Model Security Scanner</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
            Scan <span style={{ background: 'linear-gradient(135deg,#c084fc,#7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>any model.</span>
          </h1>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: 14, marginTop: 8 }}>Enter a HuggingFace model ID or a local path to begin scanning.</p>
        </div>

        {/* Scan input */}
        <div style={{ background: 'rgba(17,17,36,0.8)', border: '1px solid rgba(138,43,226,0.25)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#8b5cf6', userSelect: 'none' }}>$</span>
              <input
                value={model}
                onChange={e => setModel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !scanning && startScan()}
                placeholder="meta-llama/Llama-3-8B  or  /path/to/model"
                style={{ width: '100%', background: 'rgba(8,8,16,0.8)', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 10, padding: '11px 14px 11px 32px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#f0eaff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>
            <input
              value={hfToken}
              onChange={e => setHfToken(e.target.value)}
              placeholder="HF token (optional, for private models)"
              style={{ flex: '0 1 260px', background: 'rgba(8,8,16,0.8)', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 10, padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(240,234,255,0.6)', transition: 'border-color 0.2s' }}
            />
            <button
              className="btn-scan"
              onClick={startScan}
              disabled={scanning || !model.trim()}
              style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#8a2be2,#7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 24px rgba(138,43,226,0.4)', transition: 'all 0.25s', whiteSpace: 'nowrap' }}
            >
              {scanning ? '⟳ Scanning...' : '⬡ Run Scan →'}
            </button>
          </div>
          {error && <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 8, fontSize: 12, color: '#ff4d6d', fontFamily: 'JetBrains Mono, monospace' }}>✗ {error}</div>}
        </div>

        {/* Stats row */}
        {scans.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: '2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Scans', value: scans.length },
              { label: 'Completed', value: scans.filter(s => s.status === 'complete').length },
              { label: 'High Risk', value: scans.filter(s => ['HIGH','CRITICAL'].includes(s.risk_label)).length },
              { label: 'Clean', value: scans.filter(s => s.risk_label === 'LOW').length },
            ].map(stat => (
              <div key={stat.label} style={{ flex: '1 1 120px', background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 12, padding: '1rem 1.2rem' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg,#c084fc,#a855f7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,234,255,0.45)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Scan history */}
        <div style={{ background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(138,43,226,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: '#8b5cf6', textTransform: 'uppercase' }}>// Scan History</span>
            <span style={{ fontSize: 11, color: 'rgba(240,234,255,0.3)' }}>{scans.length} scans</span>
          </div>

          {scans.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No scans yet</div>
              <div style={{ color: 'rgba(240,234,255,0.4)', fontSize: 13 }}>Enter a HuggingFace model ID above to run your first scan.</div>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 80px', gap: 16, padding: '0.6rem 1.5rem', borderBottom: '1px solid rgba(138,43,226,0.08)' }}>
                {['Model', 'Status', 'Risk Score', 'Scanned', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, color: 'rgba(240,234,255,0.3)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {scans.map(scan => (
                <div
                  key={scan.scan_id}
                  className="scan-row"
                  onClick={() => scan.status === 'complete' && navigate(`/scans/${scan.scan_id}`)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 80px', gap: 16, padding: '0.9rem 1.5rem', borderBottom: '1px solid rgba(138,43,226,0.06)', alignItems: 'center', cursor: scan.status === 'complete' ? 'pointer' : 'default' }}
                >
                  {/* Model name */}
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#e9d5ff', fontWeight: 500 }}>{scan.target}</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,234,255,0.3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{scan.scan_id.slice(0, 8)}...</div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 10,
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, letterSpacing: '0.06em',
                      background: scan.status === 'complete' ? 'rgba(34,211,160,0.12)' : scan.status === 'running' ? 'rgba(168,85,247,0.15)' : scan.status === 'failed' ? 'rgba(255,77,109,0.12)' : 'rgba(255,255,255,0.06)',
                      color: scan.status === 'complete' ? '#22d3a0' : scan.status === 'running' ? '#c084fc' : scan.status === 'failed' ? '#ff4d6d' : 'rgba(240,234,255,0.4)',
                      border: `1px solid ${scan.status === 'complete' ? 'rgba(34,211,160,0.25)' : scan.status === 'running' ? 'rgba(168,85,247,0.3)' : scan.status === 'failed' ? 'rgba(255,77,109,0.25)' : 'rgba(255,255,255,0.08)'}`
                    }}>
                      {scan.status === 'running' ? '⟳ ' : ''}{scan.status}
                    </span>
                  </div>

                  {/* Risk score */}
                  <div>
                    {scan.risk_score !== null && scan.risk_label ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
                        borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                        background: RISK_BG[scan.risk_label] || 'rgba(255,255,255,0.05)',
                        color: RISK_COLOR[scan.risk_label] || '#f0eaff',
                        border: `1px solid ${RISK_COLOR[scan.risk_label] || 'transparent'}33`
                      }}>
                        {scan.risk_score}<span style={{ fontWeight: 400, fontSize: 10, opacity: 0.7 }}>/100 · {scan.risk_label}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(240,234,255,0.25)', fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 11, color: 'rgba(240,234,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(scan.created_at)}</div>

                  {/* Arrow */}
                  <div style={{ textAlign: 'right' }}>
                    {scan.status === 'complete' && (
                      <span style={{ fontSize: 14, color: '#8b5cf6' }}>→</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}