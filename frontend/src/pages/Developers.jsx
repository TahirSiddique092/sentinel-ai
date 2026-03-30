import { useNavigate } from 'react-router-dom'

const GITHUB_REPO = 'https://github.com/TahirSiddique092/sentinel-ai'
const API_URL = import.meta.env.VITE_API_URL

const TEAM = [
  {
    name: 'Tahir Siddique',
    role: 'Backend Engineer',
    tags: ['5 Scan Modules', 'Deployment'],
    avatar: 'TS',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.3)',
    description: 'Built all five security scanning modules — Serialization, CVE, Config Audit, Behavioral Probe, and Bias Check — including the risk scoring engine and asyncio scan orchestrator. Also handled cloud deployment on Render and Neon DB.',
    modules: [
      { icon: '🛡️', label: 'Serialization Scanner' },
      { icon: '📦', label: 'CVE Scanner' },
      { icon: '⚙️', label: 'Config Auditor' },
      { icon: '💉', label: 'Behavioral Probe' },
      { icon: '⚖️', label: 'Bias Check' },
    ]
  },
  {
    name: 'Prathith Shetty',
    role: 'Frontend Engineer',
    tags: ['Landing Page', 'Dashboard'],
    avatar: 'PS',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.3)',
    description: 'Designed and built the entire frontend — from the animated landing page with custom cursor and scroll effects, to the scan dashboard with live polling, risk score visualizations, and the scan detail view with expandable finding cards.',
    modules: [
      { icon: '🌐', label: 'Landing Page' },
      { icon: '📊', label: 'Scan Dashboard' },
      { icon: '🔍', label: 'Scan Detail View' },
      { icon: '👤', label: 'Profile Page' },
    ]
  },
  {
    name: 'Niharika Mirle',
    role: 'Backend Engineer',
    tags: ['Auth', 'User Management'],
    avatar: 'NM',
    color: '#22d3a0',
    bg: 'rgba(34,211,160,0.1)',
    border: 'rgba(34,211,160,0.3)',
    description: 'Implemented the full GitHub OAuth 2.0 authentication flow, JWT token issuance and verification, and user management APIs. Built the rate limiter, logout with token revocation, and the secure session sharing between CLI and web dashboard.',
    modules: [
      { icon: '🔐', label: 'GitHub OAuth 2.0' },
      { icon: '🎟️', label: 'JWT Auth' },
      { icon: '👥', label: 'User API' },
      { icon: '🚦', label: 'Rate Limiting' },
    ]
  },
  {
    name: 'Prarthana Acharya',
    role: 'CLI Engineer',
    tags: ['Login', 'Scan', 'Logout'],
    avatar: 'PA',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.3)',
    description: 'Built the entire sentinelai CLI package — including the GitHub OAuth login flow with local callback server, the live scan command with Rich progress panels and real-time polling, report downloading, and the logout command with server-side token revocation.',
    modules: [
      { icon: '🔑', label: 'sentinelai login' },
      { icon: '⬡', label: 'sentinelai scan' },
      { icon: '🚪', label: 'sentinelai logout' },
      { icon: '📄', label: 'Report Export' },
    ]
  },
]

export default function Developers() {
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
        .team-card { transition: transform 0.3s, box-shadow 0.3s; }
        .team-card:hover { transform: translateY(-6px); }
        .nav-lnk { color: rgba(240,234,255,0.5); text-decoration: none; font-size: 0.9rem; font-weight: 500; letter-spacing: 0.02em; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'Outfit', sans-serif; }
        .nav-lnk:hover { color: #c084fc; }
        .footer-lnk { color: rgba(240,234,255,0.5); font-size: 0.85rem; text-decoration: none; transition: color 0.2s; }
        .footer-lnk:hover { color: #c084fc; }
        .mod-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 500; margin: 3px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 6px; }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,0,200,.25) 0%,transparent 70%)', top: -200, left: -150, filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(138,43,226,.15) 0%,transparent 70%)', bottom: '5%', right: -100, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
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
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={{ padding: '0.55rem 1.3rem', border: '1px solid rgba(138,43,226,0.25)', background: 'transparent', color: 'rgba(240,234,255,0.5)', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s' }}>GitHub</a>
          <button onClick={() => navigate('/login')} style={{ padding: '0.55rem 1.4rem', background: 'linear-gradient(135deg,#8a2be2,#7c3aed)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 0 24px rgba(138,43,226,0.4)', transition: 'all 0.3s' }}>Launch Dashboard →</button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, paddingTop: '8rem', paddingBottom: '6rem', maxWidth: 1100, margin: '0 auto', padding: '8rem 2rem 6rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.4)', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c084fc', marginBottom: '1.5rem', fontFamily: "'JetBrains Mono',monospace" }}>
            // The Team
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 1.2rem' }}>
            Built by four.<br />
            <span style={{ background: 'linear-gradient(135deg,#c084fc,#7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Shipped in ten hours.</span>
          </h1>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            SentinelAI was built at Hackathon 2026 by a team of four engineers, each owning a distinct layer of the stack.
          </p>
        </div>

        {/* Team grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {TEAM.map((member, i) => (
            <div key={member.name} className="team-card" style={{ background: 'rgba(13,13,26,0.85)', border: `1px solid ${member.border}`, borderRadius: 20, padding: '2rem', backdropFilter: 'blur(10px)', boxShadow: `0 20px 60px rgba(0,0,0,0.4)` }}>

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem', marginBottom: '1.5rem' }}>
                {/* Avatar */}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: member.bg, border: `2px solid ${member.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: member.color, flexShrink: 0, boxShadow: `0 0 20px ${member.color}30` }}>
                  {member.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em', margin: 0, color: '#f0eaff' }}>{member.name}</h2>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.72rem', padding: '2px 10px', borderRadius: 4, background: member.bg, color: member.color, border: `1px solid ${member.border}`, fontWeight: 600, letterSpacing: '0.05em' }}>{member.role}</span>
                  </div>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {member.tags.map(tag => (
                      <span key={tag} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', padding: '1px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'rgba(240,234,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                {/* Number */}
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.5rem', fontWeight: 800, color: member.bg, lineHeight: 1, userSelect: 'none', opacity: 0.4 }}>0{i + 1}</div>
              </div>

              {/* Description */}
              <p style={{ color: 'rgba(240,234,255,0.65)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 1.5rem', paddingLeft: 0 }}>
                {member.description}
              </p>

              {/* Module pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                {member.modules.map(mod => (
                  <span key={mod.label} className="mod-pill" style={{ background: member.bg, color: member.color, border: `1px solid ${member.border}` }}>
                    <span style={{ fontSize: 13 }}>{mod.icon}</span>
                    {mod.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stack divider */}
        <div style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid rgba(138,43,226,0.12)', borderBottom: '1px solid rgba(138,43,226,0.12)', marginBottom: '3rem' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.15em', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '1.5rem' }}>// Built with</div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {['Python · FastAPI', 'React 19 · Vite', 'PostgreSQL · Neon', 'HuggingFace Hub', 'modelscan · pip-audit', 'GitHub OAuth · JWT', 'Click · Rich CLI', 'Render · Vercel'].map(tech => (
              <span key={tech} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', padding: '6px 16px', borderRadius: 100, background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.2)', color: 'rgba(240,234,255,0.6)' }}>{tech}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(240,234,255,0.4)', fontSize: '0.9rem', marginBottom: '1.5rem', fontFamily: "'JetBrains Mono',monospace" }}>// Want to contribute?</p>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 2rem', background: 'linear-gradient(135deg,#8a2be2,#7c3aed)', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 600, fontSize: '1rem', fontFamily: "'Outfit',sans-serif", boxShadow: '0 0 40px rgba(138,43,226,0.4)', transition: 'all 0.3s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            View on GitHub →
          </a>
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
            <li><a href="/api-docs" className="footer-lnk">API Docs</a></li>
            <li><a href="https://pypi.org/project/sentinel-ai-scanner" target="_blank" rel="noopener noreferrer" className="footer-lnk">PyPI</a></li>
            <li><a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="footer-lnk">GitHub</a></li>
            <li><a href="/developers" className="footer-lnk" style={{ color: '#a855f7' }}>Developers</a></li>
          </ul>
        </div>
        <span style={{ color: 'rgba(240,234,255,0.25)', fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>MIT License · SentinelAI 2026</span>
      </footer>
    </div>
  )
}