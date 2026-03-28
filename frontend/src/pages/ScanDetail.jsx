import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { scansAPI } from '../api/api'

const SEV_COLOR = { CRITICAL: '#ff1e50', HIGH: '#ff4d6d', MEDIUM: '#f97316', LOW: '#22d3a0', INFO: '#94a3b8' }
const SEV_BG = { CRITICAL: 'rgba(255,30,80,0.12)', HIGH: 'rgba(255,77,109,0.1)', MEDIUM: 'rgba(249,115,22,0.1)', LOW: 'rgba(34,211,160,0.1)', INFO: 'rgba(148,163,184,0.08)' }
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }

const RISK_COLOR = { LOW: '#22d3a0', MEDIUM: '#f97316', HIGH: '#ff4d6d', CRITICAL: '#ff1e50' }
const RISK_BG = { LOW: 'rgba(34,211,160,0.1)', MEDIUM: 'rgba(249,115,22,0.1)', HIGH: 'rgba(255,77,109,0.1)', CRITICAL: 'rgba(255,30,80,0.12)' }

const MODULE_ICON = { serialization: '🛡️', cve: '📦', config: '⚙️', behavioral: '💉', bias: '⚖️' }
const MODULE_LABEL = { serialization: 'Serialization', cve: 'CVE Scanner', config: 'Config Audit', behavioral: 'Behavioral Probe', bias: 'Bias Check' }

const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function ScanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    Promise.all([scansAPI.get(id), scansAPI.findings(id)])
      .then(([s, f]) => {
        setScan(s.data)
        setFindings([...f.data].sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5)))
      })
      .catch(() => setError('Could not load scan.'))
      .finally(() => setLoading(false))
  }, [id])

  const downloadReport = async (format) => {
    setDownloading(format)
    try {
      const res = await scansAPI.report(id, format)
      const blob = format === 'html' ? res.data : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${scan.target.replace('/', '-')}-report.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    setDownloading('')
  }

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a855f7', fontSize: 14 }}>Loading scan...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#ff4d6d', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>
      <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: '1px solid rgba(138,43,226,0.4)', color: '#c084fc', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>← Back to dashboard</button>
    </div>
  )

  const realFindings = findings.filter(f => f.severity !== 'INFO')
  const bySeverity = realFindings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc }, {})

  const scoreBarWidth = scan.risk_score ? `${scan.risk_score}%` : '0%'
  const scoreColor = scan.risk_label ? RISK_COLOR[scan.risk_label] : '#94a3b8'

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eaff', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .finding-card:hover { border-color: rgba(138,43,226,0.3) !important; }
        .finding-card { transition: border-color 0.2s; }
        .dl-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .dl-btn { transition: all 0.2s; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 6px; }
      `}</style>

      {/* Ambient */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,0,200,.15) 0%,transparent 70%)', top: -100, right: -100, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 60, background: 'rgba(8,8,16,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(138,43,226,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: '1px solid rgba(138,43,226,0.25)', color: 'rgba(240,234,255,0.6)', padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, transition: 'all 0.2s' }}>← Dashboard</button>
          <div style={{ width: 1, height: 20, background: 'rgba(138,43,226,0.25)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(240,234,255,0.5)' }}>{scan?.target}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="dl-btn" onClick={() => downloadReport('json')} disabled={scan?.status !== 'complete' || downloading === 'json'} style={{ background: 'rgba(17,17,36,0.8)', border: '1px solid rgba(138,43,226,0.25)', color: downloading === 'json' ? '#8b5cf6' : 'rgba(240,234,255,0.7)', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            {downloading === 'json' ? '⟳ ...' : '↓ JSON'}
          </button>
          <button className="dl-btn" onClick={() => downloadReport('html')} disabled={scan?.status !== 'complete' || downloading === 'html'} style={{ background: 'linear-gradient(135deg,rgba(138,43,226,0.3),rgba(124,58,237,0.3))', border: '1px solid rgba(138,43,226,0.4)', color: downloading === 'html' ? '#c084fc' : '#f0eaff', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            {downloading === 'html' ? '⟳ ...' : '↓ HTML Report'}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 4rem', position: 'relative', zIndex: 1 }}>

        {/* Top: score + meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', marginBottom: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>

          {/* Risk score card */}
          <div style={{ background: 'rgba(17,17,36,0.8)', border: `1px solid ${scoreColor}33`, borderRadius: 20, padding: '2rem 2.5rem', textAlign: 'center', minWidth: 200, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(240,234,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Risk Score</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1, color: scoreColor, textShadow: `0 0 40px ${scoreColor}80` }}>
              {scan?.risk_score ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,234,255,0.5)', marginTop: 2 }}>/100</div>
            {scan?.risk_label && (
              <div style={{ marginTop: 16, padding: '5px 16px', background: RISK_BG[scan.risk_label], border: `1px solid ${scoreColor}55`, borderRadius: 100, display: 'inline-block', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: scoreColor, letterSpacing: '0.1em' }}>
                {scan.risk_label}
              </div>
            )}
            {scan?.risk_score !== null && (
              <div style={{ marginTop: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: scoreBarWidth, borderRadius: 100, background: `linear-gradient(90deg,#22d3a0,${scoreColor})`, transition: 'width 1s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8b5cf6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>// Model</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', fontWeight: 800, letterSpacing: '-0.02em', wordBreak: 'break-all' }}>{scan?.target}</div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Status', value: scan?.status },
                { label: 'Scan ID', value: scan?.scan_id?.slice(0, 12) + '...' },
                { label: 'Started', value: fmt(scan?.created_at) },
                { label: 'Completed', value: fmt(scan?.completed_at) },
              ].map(m => (
                <div key={m.label} style={{ background: 'rgba(17,17,36,0.6)', border: '1px solid rgba(138,43,226,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(240,234,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#e9d5ff' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Finding counts */}
            {realFindings.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(bySeverity).sort((a, b) => (SEV_ORDER[a[0]] ?? 5) - (SEV_ORDER[b[0]] ?? 5)).map(([sev, count]) => (
                  <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: SEV_BG[sev], border: `1px solid ${SEV_COLOR[sev]}44`, borderRadius: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: SEV_COLOR[sev], boxShadow: `0 0 6px ${SEV_COLOR[sev]}` }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: SEV_COLOR[sev], fontWeight: 600 }}>{count} {sev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Module status */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8b5cf6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>// Scan Modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
            {Object.entries(scan?.modules_status || {}).map(([key, status]) => {
              const moduleFindings = findings.filter(f => f.module === key && f.severity !== 'INFO')
              const worstSev = moduleFindings[0]?.severity
              return (
                <div key={key} style={{ background: 'rgba(17,17,36,0.7)', border: `1px solid ${status === 'complete' && moduleFindings.length === 0 ? 'rgba(34,211,160,0.2)' : status === 'complete' ? 'rgba(255,77,109,0.2)' : 'rgba(138,43,226,0.15)'}`, borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{MODULE_ICON[key] || '🔍'}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.06em',
                      background: status === 'complete' ? 'rgba(34,211,160,0.1)' : status === 'running' ? 'rgba(168,85,247,0.15)' : status === 'failed' ? 'rgba(255,77,109,0.12)' : 'rgba(255,255,255,0.05)',
                      color: status === 'complete' ? '#22d3a0' : status === 'running' ? '#c084fc' : status === 'failed' ? '#ff4d6d' : 'rgba(240,234,255,0.35)'
                    }}>{status}</span>
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{MODULE_LABEL[key]}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: moduleFindings.length > 0 ? SEV_COLOR[worstSev] : 'rgba(34,211,160,0.7)' }}>
                    {status !== 'complete' ? '—' : moduleFindings.length === 0 ? '✓ PASS' : `✗ ${moduleFindings.length} issue${moduleFindings.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Findings */}
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8b5cf6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>// Findings ({realFindings.length})</span>
            {realFindings.length === 0 && scan?.status === 'complete' && (
              <span style={{ color: '#22d3a0' }}>✓ No issues detected</span>
            )}
          </div>

          {realFindings.length === 0 && scan?.status === 'complete' ? (
            <div style={{ background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: '#22d3a0', marginBottom: 8 }}>Model passed all checks</div>
              <div style={{ color: 'rgba(240,234,255,0.5)', fontSize: 13 }}>No security vulnerabilities, misconfigurations, or bias signals detected.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {realFindings.map(f => (
                <div key={f.id} className="finding-card" style={{ background: 'rgba(17,17,36,0.7)', border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `3px solid ${SEV_COLOR[f.severity] || '#94a3b8'}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header row — always visible */}
                  <div
                    onClick={() => toggle(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.2rem', cursor: 'pointer' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEV_COLOR[f.severity], boxShadow: `0 0 8px ${SEV_COLOR[f.severity]}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.06em', background: SEV_BG[f.severity], color: SEV_COLOR[f.severity], border: `1px solid ${SEV_COLOR[f.severity]}33`, flexShrink: 0 }}>{f.severity}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{f.title}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(240,234,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 4 }}>{f.module}</span>
                      {f.owasp_tag && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(168,85,247,0.2)' }}>{f.owasp_tag}</span>}
                      <span style={{ color: 'rgba(240,234,255,0.3)', fontSize: 14, transform: expanded[f.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded[f.id] && (
                    <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid rgba(138,43,226,0.1)' }}>
                      <p style={{ fontSize: 13, color: 'rgba(240,234,255,0.65)', lineHeight: 1.75, margin: '12px 0 0' }}>{f.description}</p>
                      {f.remediation && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.15)', borderRadius: 8 }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#22d3a0', letterSpacing: '0.1em', marginBottom: 4 }}>FIX</div>
                          <p style={{ fontSize: 13, color: '#22d3a0', margin: 0, lineHeight: 1.65 }}>{f.remediation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}