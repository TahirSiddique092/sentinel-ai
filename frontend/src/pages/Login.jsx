import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Already logged in → skip straight to dashboard
    if (localStorage.getItem('sentinel_token')) {
      navigate('/dashboard', { replace: true })
    }
  }, [])

  const handleContinue = (e) => {
    e.preventDefault()
    const input = username.trim().toLowerCase()
    if (!input) { setError('Please enter your GitHub username'); return }

    // Check if a session already exists for this username
    const raw = localStorage.getItem('sentinel_last_user')
    const token = localStorage.getItem('sentinel_token')
    if (raw && token) {
      try {
        const last = JSON.parse(raw)
        if (last.username.toLowerCase() === input) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch (_) {}
    }

    // No matching session — start GitHub OAuth
    window.location.href = `${API_URL}/auth/github`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0eaff', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .continue-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 40px rgba(138,43,226,0.7) !important; }
        .continue-btn { transition: all 0.25s; }
        .username-input:focus { outline: none; border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
      `}</style>

      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,0,200,.2) 0%,transparent 70%)', top: -200, left: -150, filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(138,43,226,.12) 0%,transparent 70%)', bottom: '5%', right: -100, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(138,43,226,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(138,43,226,.04) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: '0 1.5rem' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#8a2be2,#bf5fff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 0 20px rgba(138,43,226,0.5)' }}>⬡</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>SentinelAI</span>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(17,17,36,0.9)', border: '1px solid rgba(138,43,226,0.25)', borderRadius: 20, padding: '2.5rem 2rem', backdropFilter: 'blur(20px)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>

          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem', textAlign: 'center' }}>
            Welcome back
          </h1>
          <p style={{ color: 'rgba(240,234,255,0.4)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
            Enter your GitHub username to continue
          </p>

          <form onSubmit={handleContinue}>
            {/* Username field */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, userSelect: 'none' }}>@</span>
              <input
                className="username-input"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleContinue(e)}
                placeholder="your-github-username"
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(8,8,16,0.8)',
                  border: '1px solid rgba(138,43,226,0.25)',
                  borderRadius: 12,
                  padding: '0.8rem 1rem 0.8rem 2.2rem',
                  color: '#f0eaff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 14,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 8, fontSize: 12, color: '#ff4d6d', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="continue-btn"
              disabled={!username.trim()}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: username.trim() ? 'linear-gradient(135deg,#8a2be2,#7c3aed)' : 'rgba(138,43,226,0.2)',
                border: 'none', borderRadius: 12,
                color: username.trim() ? '#fff' : 'rgba(240,234,255,0.3)',
                fontSize: '0.95rem', fontWeight: 600,
                fontFamily: "'Outfit',sans-serif",
                cursor: username.trim() ? 'pointer' : 'not-allowed',
                boxShadow: username.trim() ? '0 0 28px rgba(138,43,226,0.4)' : 'none',
              }}
            >
              Continue →
            </button>
          </form>

          <p style={{ color: 'rgba(240,234,255,0.2)', fontSize: '0.72rem', textAlign: 'center', marginTop: '1.25rem', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
            If you haven't authorized before, you'll be<br />redirected to GitHub to sign in.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: 'rgba(240,234,255,0.3)', fontSize: 13, textDecoration: 'none' }}
            onMouseOver={e => e.target.style.color = 'rgba(240,234,255,0.7)'}
            onMouseOut={e => e.target.style.color = 'rgba(240,234,255,0.3)'}
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
