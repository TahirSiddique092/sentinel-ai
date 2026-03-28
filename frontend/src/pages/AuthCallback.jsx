import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('sentinel_token', token)
      // Store last-user info so login page can show "Continue as @username"
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(u => {
          if (u.github_username) {
            localStorage.setItem('sentinel_last_user', JSON.stringify({
              username: u.github_username,
              avatar: u.avatar_url,
            }))
          }
        })
        .catch(() => {})
        .finally(() => navigate('/dashboard'))
    } else {
      navigate('/login')
    }
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
      Signing in...
    </div>
  )
}