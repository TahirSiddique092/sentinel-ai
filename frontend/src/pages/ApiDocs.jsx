import { useNavigate } from 'react-router-dom'

const GITHUB_REPO = 'https://github.com/TahirSiddique092/sentinel-ai'
const API_URL = import.meta.env.VITE_API_URL

const ENDPOINTS = [
  {
    group: 'Health',
    color: '#22d3a0',
    items: [
      {
        method: 'GET', path: '/health', auth: false,
        summary: 'Health check',
        description: 'Returns server status. Use this to verify the backend is running before making other requests.',
        response: `{ "status": "ok" }`
      }
    ]
  },
  {
    group: 'Authentication',
    color: '#a855f7',
    items: [
      {
        method: 'GET', path: '/auth/github', auth: false,
        summary: 'Start GitHub OAuth flow',
        description: 'Redirects the browser to GitHub\'s OAuth authorization page. Pass redirect_uri to control where GitHub sends the user after login.',
        params: [{ name: 'redirect_uri', type: 'query', required: false, desc: 'Where to redirect after auth (default: FRONTEND_URL/auth/callback)' }],
      },
      {
        method: 'GET', path: '/auth/callback', auth: false,
        summary: 'OAuth callback — issues JWT',
        description: 'GitHub redirects here after authorization. Exchanges the code for an access token, upserts the user in the database, and issues a JWT. Redirects to redirect_uri with ?token=<JWT>.',
        params: [
          { name: 'code', type: 'query', required: true, desc: 'GitHub authorization code' },
          { name: 'state', type: 'query', required: false, desc: 'Encoded redirect_uri from the initial request' },
        ],
      },
      {
        method: 'GET', path: '/auth/me', auth: true,
        summary: 'Get current user',
        description: 'Verifies the JWT and returns the authenticated user\'s profile.',
        response: `{
  "id": "uuid",
  "github_username": "johndoe",
  "email": "john@example.com",
  "avatar_url": "https://avatars.githubusercontent.com/...",
  "created_at": "2026-03-28T10:00:00Z"
}`
      },
      {
        method: 'POST', path: '/auth/logout', auth: true,
        summary: 'Logout and revoke token',
        description: 'Revokes the GitHub OAuth token server-side so the user is fully signed out from GitHub\'s perspective. The client should also clear the JWT from localStorage.',
        response: `{ "ok": true }`
      }
    ]
  },
  {
    group: 'Scans',
    color: '#f97316',
    items: [
      {
        method: 'POST', path: '/scans', auth: true,
        summary: 'Start a new scan',
        description: 'Creates a scan record in the database and immediately returns a scan_id. The actual scan runs asynchronously in the background — poll GET /scans/{id} to track progress.',
        body: `{
  "target": "distilbert-base-uncased",
  "target_type": "huggingface",
  "hf_token": "hf_optional_for_private_models"
}`,
        response: `{
  "scan_id": "uuid",
  "status": "pending",
  "created_at": "2026-03-28T10:00:00Z"
}`
      },
      {
        method: 'GET', path: '/scans', auth: true,
        summary: 'List all scans',
        description: 'Returns all scans for the authenticated user, ordered by most recent first. Limited to 50 results.',
        response: `[
  {
    "scan_id": "uuid",
    "target": "distilbert-base-uncased",
    "status": "complete",
    "risk_score": 12,
    "risk_label": "LOW",
    "created_at": "...",
    "completed_at": "..."
  }
]`
      },
      {
        method: 'GET', path: '/scans/{scan_id}', auth: true,
        summary: 'Poll scan status',
        description: 'Returns the current state of a scan including per-module status. Poll this every 2-3 seconds until status is "complete" or "failed". The modules_status field shows each of the 5 modules as pending → running → complete.',
        response: `{
  "scan_id": "uuid",
  "target": "distilbert-base-uncased",
  "status": "running",
  "risk_score": null,
  "risk_label": null,
  "modules_status": {
    "serialization": "complete",
    "cve": "running",
    "config": "complete",
    "behavioral": "pending",
    "bias": "pending"
  },
  "findings_count": { "HIGH": 1, "MEDIUM": 2 },
  "created_at": "...",
  "completed_at": null
}`
      },
      {
        method: 'GET', path: '/scans/{scan_id}/findings', auth: true,
        summary: 'Get scan findings',
        description: 'Returns all findings for a completed scan, sorted by severity (CRITICAL first). INFO-level findings are not stored — only actionable findings are returned.',
        response: `[
  {
    "id": "uuid",
    "module": "config",
    "severity": "CRITICAL",
    "title": "trust_remote_code enabled",
    "description": "config.json sets trust_remote_code: true...",
    "owasp_tag": "LLM03",
    "remediation": "Remove trust_remote_code from config.json...",
    "created_at": "..."
  }
]`
      },
      {
        method: 'GET', path: '/scans/{scan_id}/report', auth: true,
        summary: 'Download scan report',
        description: 'Returns the full scan report. Use format=json for machine-readable output (CI/CD pipelines), or format=html for a styled HTML report you can open in a browser or share with stakeholders.',
        params: [{ name: 'format', type: 'query', required: false, desc: 'json (default) or html' }],
        response: `{
  "scan_id": "uuid",
  "target": "distilbert-base-uncased",
  "risk_score": 42,
  "risk_label": "MEDIUM",
  "generated_at": "...",
  "findings": [...],
  "summary": {
    "total_findings": 3,
    "by_severity": { "HIGH": 1, "MEDIUM": 2 }
  }
}`
      }
    ]
  },
  {
    group: 'Users',
    color: '#38bdf8',
    items: [
      {
        method: 'GET', path: '/users/me', auth: true,
        summary: 'Get user profile + scan count',
        description: 'Returns the authenticated user\'s profile with their total scan count. Used by the Profile page.',
        response: `{
  "id": "uuid",
  "github_username": "johndoe",
  "email": "john@example.com",
  "avatar_url": "https://...",
  "created_at": "...",
  "scan_count": 14
}`
      }
    ]
  }
]

const METHOD_COLOR = { GET: '#22d3a0', POST: '#a855f7', DELETE: '#ff4d6d', PUT: '#f97316' }
const METHOD_BG = { GET: 'rgba(34,211,160,0.1)', POST: 'rgba(168,85,247,0.1)', DELETE: 'rgba(255,77,109,0.1)', PUT: 'rgba(249,115,22,0.1)' }

export default function ApiDocs() {
  const navigate = useNavigate()

  const goTo = (hash) => {
    navigate('/')
    setTimeout(() => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eaff', fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .ep-card { transition: border-color 0.2s; }
        .ep-card:hover { border-color: rgba(138,43,226,0.3) !important; }
        .nav-lnk { color: rgba(240,234,255,0.5); text-decoration: none; font-size: 0.9rem; font-weight: 500; letter-spacing: 0.02em; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'Outfit', sans-serif; }
        .nav-lnk:hover { color: #c084fc; }
        .footer-lnk { color: rgba(240,234,255,0.5); font-size: 0.85rem; text-decoration: none; transition: color 0.2s; }
        .footer-lnk:hover { color: #c084fc; }
        pre { margin: 0; white-space: pre; overflow-x: auto; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 6px; }
      `}</style>

      {/* Ambient */}
      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,0,200,.2) 0%,transparent 70%)', top: -200, left: -150, filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(138,43,226,.12) 0%,transparent 70%)', bottom: '5%', right: -100, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(138,43,226,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(138,43,226,.04) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 4rem', background: 'rgba(8,8,16,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(138,43,226,0.25)' }}>
        <a onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#8a2be2,#bf5fff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 0 20px rgba(138,43,226,0.45)' }}>⬡</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f0eaff' }}>SentinelAI</span>
        </a>
        <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><button className="nav-lnk" onClick={() => goTo('modules')}>Modules</button></li>
          <li><button className="nav-lnk" onClick={() => goTo('how')}>How It Works</button></li>
          <li><button className="nav-lnk" onClick={() => goTo('risk')}>Risk Scoring</button></li>
          <li><button className="nav-lnk" onClick={() => goTo('tech')}>Tech Stack</button></li>
          <li><button className="nav-lnk" onClick={() => goTo('install')}>Install</button></li>
        </ul>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={{ padding: '0.55rem 1.3rem', border: '1px solid rgba(138,43,226,0.25)', background: 'transparent', color: 'rgba(240,234,255,0.5)', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>GitHub</a>
          <button onClick={() => navigate('/login')} style={{ padding: '0.55rem 1.4rem', background: 'linear-gradient(135deg,#8a2be2,#7c3aed)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 0 24px rgba(138,43,226,0.4)' }}>Launch Dashboard →</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '8rem 2rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.4)', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', color: '#c084fc', marginBottom: '1.5rem', fontFamily: "'JetBrains Mono',monospace" }}>
            // REST API Reference
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 1rem' }}>
            API Reference
          </h1>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 620, margin: '0 0 1.5rem' }}>
            The SentinelAI REST API lets you integrate model scanning into your own pipelines. All protected routes require a <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.9rem', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 4, color: '#c084fc' }}>Bearer</code> JWT in the Authorization header.
          </p>
          {/* Base URL pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(138,43,226,0.25)', borderRadius: 10, padding: '10px 18px' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: '#8b5cf6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Base URL</span>
            <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem', color: '#f0eaff' }}>{API_URL || 'https://sentinelai-api.onrender.com'}</code>
          </div>
        </div>

        {/* Auth note */}
        <div style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: '1rem 1.4rem', marginBottom: '3rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔐</span>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: '#a855f7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Authentication</div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(240,234,255,0.65)', lineHeight: 1.7 }}>
              Protected routes require <code style={{ fontFamily: "'JetBrains Mono',monospace", color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 3 }}>Authorization: Bearer &lt;JWT&gt;</code> in the request header. Get a JWT by completing the GitHub OAuth flow via <code style={{ fontFamily: "'JetBrains Mono',monospace", color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 3 }}>GET /auth/github</code>, or by running <code style={{ fontFamily: "'JetBrains Mono',monospace", color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 3 }}>sentinelai login</code> in the CLI.
            </p>
          </div>
        </div>

        {/* Endpoint groups */}
        {ENDPOINTS.map(group => (
          <div key={group.group} style={{ marginBottom: '3.5rem' }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${group.color}22` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, boxShadow: `0 0 8px ${group.color}` }} />
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: 0, color: group.color }}>{group.group}</h2>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.72rem', color: 'rgba(240,234,255,0.3)' }}>{group.items.length} endpoint{group.items.length > 1 ? 's' : ''}</span>
            </div>

            {/* Endpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {group.items.map((ep, i) => (
                <div key={i} className="ep-card" style={{ background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: METHOD_BG[ep.method], color: METHOD_COLOR[ep.method], border: `1px solid ${METHOD_COLOR[ep.method]}33`, letterSpacing: '0.05em', flexShrink: 0 }}>{ep.method}</span>
                    <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.92rem', color: '#f0eaff', flex: 1 }}>{ep.path}</code>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {ep.auth ? (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>🔐 JWT</span>
                      ) : (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(34,211,160,0.08)', color: '#22d3a0', border: '1px solid rgba(34,211,160,0.2)' }}>public</span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1rem 1.4rem' }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{ep.summary}</div>
                    <p style={{ color: 'rgba(240,234,255,0.55)', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 1rem' }}>{ep.description}</p>

                    {/* Params */}
                    {ep.params && ep.params.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(240,234,255,0.3)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Parameters</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {ep.params.map(p => (
                            <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.82rem', color: '#c084fc', flexShrink: 0 }}>{p.name}</code>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'rgba(240,234,255,0.4)' }}>{p.type}</span>
                              {p.required && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(255,77,109,0.1)', color: '#ff4d6d' }}>required</span>}
                              <span style={{ fontSize: '0.83rem', color: 'rgba(240,234,255,0.5)', flex: 1 }}>{p.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request body */}
                    {ep.body && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(240,234,255,0.3)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Request Body</div>
                        <div style={{ background: 'rgba(8,8,16,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 16px' }}>
                          <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: '#c084fc', lineHeight: 1.7 }}>{ep.body}</pre>
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    {ep.response && (
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(240,234,255,0.3)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Example Response</div>
                        <div style={{ background: 'rgba(8,8,16,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 16px' }}>
                          <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: '#22d3a0', lineHeight: 1.7 }}>{ep.response}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Swagger link */}
        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 16, marginTop: '2rem' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: '#8b5cf6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Interactive Docs</div>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.9rem', marginBottom: '1.2rem', lineHeight: 1.6 }}>
            The backend also exposes auto-generated Swagger UI and ReDoc documentation with a live "Try it out" console.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.4rem', background: 'linear-gradient(135deg,#8a2be2,#7c3aed)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', fontFamily: "'Outfit',sans-serif", textDecoration: 'none', boxShadow: '0 0 24px rgba(138,43,226,0.4)' }}>
              Swagger UI ↗
            </a>
            <a href={`${API_URL}/redoc`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.4rem', background: 'transparent', color: 'rgba(240,234,255,0.6)', border: '1px solid rgba(138,43,226,0.3)', borderRadius: 10, fontWeight: 500, fontSize: '0.9rem', fontFamily: "'Outfit',sans-serif", textDecoration: 'none' }}>
              ReDoc ↗
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(138,43,226,0.15)', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#8a2be2,#bf5fff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>⬡</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#f0eaff' }}>SentinelAI</span>
          </a>
          <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="/api-docs" className="footer-lnk" style={{ color: '#a855f7' }}>API Docs</a></li>
            <li><a href="https://pypi.org/project/sentinelai" target="_blank" rel="noopener noreferrer" className="footer-lnk">PyPI</a></li>
            <li><a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="footer-lnk">GitHub</a></li>
            <li><a href="/developers" className="footer-lnk">Developers</a></li>
          </ul>
        </div>
        <span style={{ color: 'rgba(240,234,255,0.25)', fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>MIT License · SentinelAI 2026</span>
      </footer>
    </div>
  )
}