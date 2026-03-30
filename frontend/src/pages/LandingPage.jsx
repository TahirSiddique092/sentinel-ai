import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const GITHUB_REPO = 'https://github.com/TahirSiddique092/sentinel-ai'
const API_URL = import.meta.env.VITE_API_URL

export default function LandingPage() {
  const navigate = useNavigate()
  const cursorRef = useRef(null)
  const ringRef = useRef(null)

  // redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('sentinel_token')) {
      navigate('/dashboard')
    }
  }, [navigate])

  // custom cursor
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!cursor || !ring) return

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY
      cursor.style.left = mx + 'px'
      cursor.style.top = my + 'px'
    }
    document.addEventListener('mousemove', onMove)

    let rafId
    const animRing = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      rafId = requestAnimationFrame(animRing)
    }
    rafId = requestAnimationFrame(animRing)

    const hoverEls = document.querySelectorAll('a, button, .module-card, .tech-pill, .bento-card')
    const onEnter = () => { cursor.style.width = '20px'; cursor.style.height = '20px'; ring.style.width = '60px'; ring.style.height = '60px' }
    const onLeave = () => { cursor.style.width = '12px'; cursor.style.height = '12px'; ring.style.width = '36px'; ring.style.height = '36px' }
    hoverEls.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave) })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
      hoverEls.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave) })
    }
  }, [])

  // scroll reveal
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 60)
      })
    }, { threshold: 0.08 })
    reveals.forEach(el => obs.observe(el))

    document.querySelectorAll('.modules-grid, .bento, .tech-grid').forEach(grid => {
      ;[...grid.children].forEach((child, i) => { child.style.transitionDelay = i * 0.07 + 's' })
    })

    // terminal typing
    const termLines = document.querySelectorAll('.terminal-body > div')
    termLines.forEach((line, i) => {
      line.style.opacity = '0'
      line.style.transform = 'translateX(-8px)'
      line.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      setTimeout(() => { line.style.opacity = '1'; line.style.transform = 'translateX(0)' }, 800 + i * 100)
    })

    // counter animation
    function animateNum(el, target) {
      let start = 0
      const dur = 1800
      const step = (ts) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = Math.round(eased * target)
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    const strip = document.querySelector('.stats-strip')
    if (strip) {
      const statObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const nums = e.target.querySelectorAll('.stat-num')
            nums[0] && animateNum(nums[0], 5)
            nums[1] && animateNum(nums[1], 20)
            statObs.unobserve(e.target)
          }
        })
      }, { threshold: 0.5 })
      statObs.observe(strip)
    }

    return () => obs.disconnect()
  }, [])

  const copyCode = () => {
    const code = `pip install sentinelai\nsentinelai login\nsentinelai scan meta-llama/Llama-3-8B`
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector('.code-copy')
      if (btn) { btn.textContent = '✓ Copied!'; btn.style.color = 'var(--safe)'; setTimeout(() => { btn.textContent = '⎘ Copy'; btn.style.color = '' }, 2000) }
    })
  }

  // GitHub OAuth — redirect to /login which handles the GitHub OAuth flow
  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <>
      <style>{`
        :root {
          --black: #080810; --deep: #0d0d1a; --panel: #111124;
          --border: rgba(138,43,226,0.25); --purple-900: #1a0033;
          --purple-700: #5b1fa8; --purple-500: #8a2be2; --purple-400: #a855f7;
          --purple-300: #c084fc; --purple-glow: rgba(138,43,226,0.45);
          --violet: #7c3aed; --neon: #bf5fff; --white: #f0eaff;
          --muted: rgba(240,234,255,0.5); --danger: #ff4d6d; --warn: #f97316;
          --safe: #22d3a0; --info: #38bdf8;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--black); color: var(--white); font-family: 'Outfit', sans-serif; overflow-x: hidden; cursor: none; }
        body::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.035; pointer-events: none; z-index: 9990;
        }
        .cursor { position: fixed; width: 12px; height: 12px; background: var(--neon); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%,-50%); transition: transform 0.08s, width 0.2s, height 0.2s, background 0.2s; mix-blend-mode: difference; }
        .cursor-ring { position: fixed; width: 36px; height: 36px; border: 1.5px solid var(--purple-400); border-radius: 50%; pointer-events: none; z-index: 9998; transform: translate(-50%,-50%); transition: transform 0.18s ease, width 0.3s, height 0.3s; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle,rgba(92,0,200,.35) 0%,transparent 70%); top: -200px; left: -150px; animation: drift1 18s ease-in-out infinite; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle,rgba(138,43,226,.2) 0%,transparent 70%); bottom: 5%; right: -100px; animation: drift2 22s ease-in-out infinite; }
        .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle,rgba(60,0,120,.25) 0%,transparent 70%); top: 50%; left: 40%; animation: drift3 16s ease-in-out infinite; }
        @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,80px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-80px,-60px)} }
        @keyframes drift3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-70px)} }
        .grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(138,43,226,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(138,43,226,.06) 1px,transparent 1px); background-size: 60px 60px; }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 4rem; background: rgba(8,8,16,.7); backdrop-filter: blur(20px) saturate(180%); border-bottom: 1px solid var(--border); }
        .nav-logo { display: flex; align-items: center; gap: .75rem; font-family: 'Syne',sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -.02em; text-decoration: none; color: var(--white); cursor: pointer; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg,var(--purple-500),var(--neon)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; box-shadow: 0 0 20px var(--purple-glow); }
        .nav-links { display: flex; gap: 2.5rem; list-style: none; }
        .nav-links a { color: var(--muted); text-decoration: none; font-size: .9rem; font-weight: 500; letter-spacing: .02em; transition: color .2s; }
        .nav-links a:hover { color: var(--purple-300); }
        .nav-cta { display: flex; gap: .75rem; align-items: center; }
        .btn-ghost { padding: .55rem 1.3rem; border: 1px solid var(--border); background: transparent; color: var(--muted); border-radius: 8px; font-family: 'Outfit',sans-serif; font-size: .88rem; font-weight: 500; cursor: pointer; transition: all .2s; text-decoration: none; display: inline-flex; align-items: center; gap: .4rem; }
        .btn-ghost:hover { border-color: var(--purple-400); color: var(--white); background: rgba(138,43,226,.1); }
        .btn-primary { padding: .55rem 1.4rem; background: linear-gradient(135deg,var(--purple-500),var(--violet)); color: #fff; border: none; border-radius: 8px; font-family: 'Outfit',sans-serif; font-size: .88rem; font-weight: 600; cursor: pointer; transition: all .3s; text-decoration: none; display: inline-flex; align-items: center; gap: .4rem; box-shadow: 0 0 24px rgba(138,43,226,.4); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 36px rgba(138,43,226,.65); }
        section { position: relative; z-index: 1; }
        #hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 2rem 4rem; overflow: hidden; }
        .hero-badge { display: inline-flex; align-items: center; gap: .5rem; padding: .4rem 1rem; background: rgba(138,43,226,.15); border: 1px solid rgba(138,43,226,.4); border-radius: 100px; font-size: .8rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--purple-300); margin-bottom: 2rem; animation: fadeUp .8s ease both; }
        .badge-dot { width: 6px; height: 6px; background: var(--neon); border-radius: 50%; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        .hero-title { font-family: 'Syne',sans-serif; font-size: clamp(3rem,7vw,6.5rem); font-weight: 800; line-height: 1.0; letter-spacing: -.03em; animation: fadeUp .9s .1s ease both; max-width: 900px; }
        .hero-title span { background: linear-gradient(135deg,#c084fc 0%,#a855f7 40%,#7c3aed 80%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; display: block; }
        .hero-sub { margin-top: 1.5rem; max-width: 580px; font-size: 1.15rem; color: var(--muted); line-height: 1.7; font-weight: 400; animation: fadeUp 1s .2s ease both; }
        .hero-actions { display: flex; gap: 1rem; margin-top: 2.5rem; flex-wrap: wrap; justify-content: center; animation: fadeUp 1.1s .3s ease both; }
        .btn-hero { padding: .9rem 2.2rem; background: linear-gradient(135deg,var(--purple-500) 0%,var(--violet) 100%); color: #fff; border: none; border-radius: 12px; font-family: 'Outfit',sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .3s; text-decoration: none; display: inline-flex; align-items: center; gap: .6rem; box-shadow: 0 0 40px rgba(138,43,226,.5),0 8px 32px rgba(0,0,0,.4); }
        .btn-hero:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 60px rgba(138,43,226,.75),0 12px 40px rgba(0,0,0,.5); }
        .btn-hero-ghost { padding: .9rem 2.2rem; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.12); color: var(--white); border-radius: 12px; font-family: 'Outfit',sans-serif; font-size: 1rem; font-weight: 500; cursor: pointer; transition: all .3s; text-decoration: none; display: inline-flex; align-items: center; gap: .6rem; }
        .btn-hero-ghost:hover { background: rgba(138,43,226,.12); border-color: var(--purple-400); transform: translateY(-2px); }
        .terminal-wrap { margin-top: 4rem; width: 100%; max-width: 720px; animation: fadeUp 1.2s .4s ease both; }
        .terminal { background: rgba(13,13,26,.95); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 120px rgba(0,0,0,.7),0 0 60px rgba(138,43,226,.15); }
        .terminal-bar { display: flex; align-items: center; gap: .5rem; padding: .9rem 1.2rem; background: rgba(255,255,255,.03); border-bottom: 1px solid var(--border); }
        .t-dot { width: 12px; height: 12px; border-radius: 50%; }
        .t-red{background:#ff5f57}.t-yellow{background:#febc2e}.t-green{background:#28c840}
        .t-title { flex: 1; text-align: center; font-size: .78rem; color: var(--muted); font-family: 'JetBrains Mono',monospace; }
        .terminal-body { padding: 1.5rem 1.8rem; font-family: 'JetBrains Mono',monospace; font-size: .82rem; line-height: 1.9; }
        .t-comment{color:rgba(138,43,226,.6)}.t-cmd{color:var(--purple-300)}.t-pass{color:var(--safe)}.t-warn-c{color:var(--warn)}.t-fail{color:var(--danger)}.t-score{color:var(--neon);font-weight:700;font-size:1rem}.t-muted{color:var(--muted)}.t-label{display:inline-block;background:rgba(255,77,109,.2);border:1px solid rgba(255,77,109,.4);padding:.1em .6em;border-radius:4px;color:var(--danger);font-size:.78rem}
        .stats-strip { display: flex; justify-content: center; gap: 0; flex-wrap: wrap; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: rgba(13,13,26,.6); backdrop-filter: blur(20px); padding: 2.5rem 4rem; }
        .stat-item { flex: 1; min-width: 180px; text-align: center; padding: 0 2rem; position: relative; }
        .stat-item::after { content: ''; position: absolute; right: 0; top: 15%; bottom: 15%; width: 1px; background: var(--border); }
        .stat-item:last-child::after { display: none; }
        .stat-num { font-family: 'Syne',sans-serif; font-size: 3rem; font-weight: 800; background: linear-gradient(135deg,var(--purple-300),var(--neon)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .stat-label { color: var(--muted); font-size: .85rem; margin-top: .4rem; font-weight: 500; }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-eyebrow { font-size: .75rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--purple-400); margin-bottom: 1rem; }
        .section-title { font-family: 'Syne',sans-serif; font-size: clamp(2rem,4vw,3.2rem); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
        .section-sub { color: var(--muted); font-size: 1rem; margin-top: 1rem; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.7; }
        #modules { padding: 6rem 4rem; }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
        .module-card { background: var(--panel); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; transition: all .35s cubic-bezier(.23,1,.32,1); position: relative; overflow: hidden; }
        .module-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(138,43,226,.08),transparent 60%); opacity: 0; transition: opacity .35s; }
        .module-card:hover { transform: translateY(-6px); border-color: var(--purple-500); box-shadow: 0 20px 60px rgba(138,43,226,.2); }
        .module-card:hover::before { opacity: 1; }
        .module-icon { width: 56px; height: 56px; border-radius: 16px; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: center; }
        .module-num { position: absolute; top: 1.5rem; right: 1.8rem; font-family: 'JetBrains Mono',monospace; font-size: .72rem; color: var(--border); font-weight: 500; letter-spacing: .1em; }
        .module-title { font-family: 'Syne',sans-serif; font-size: 1.2rem; font-weight: 700; margin-bottom: .6rem; }
        .module-desc { color: var(--muted); font-size: .9rem; line-height: 1.65; }
        .module-tag { display: inline-block; margin-top: 1.2rem; padding: .25rem .7rem; border-radius: 6px; font-size: .72rem; font-family: 'JetBrains Mono',monospace; font-weight: 500; letter-spacing: .04em; }
        .ic-blue{background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.25);color:var(--info)}.ic-orange{background:rgba(249,115,22,.15);border:1px solid rgba(249,115,22,.25);color:var(--warn)}.ic-red{background:rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.25);color:var(--danger)}.ic-purple{background:rgba(138,43,226,.18);border:1px solid rgba(138,43,226,.35);color:var(--purple-300)}.ic-green{background:rgba(34,211,160,.15);border:1px solid rgba(34,211,160,.25);color:var(--safe)}
        .tag-supply{background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);color:var(--info)}.tag-prompt{background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);color:var(--danger)}.tag-config{background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);color:var(--warn)}.tag-bias{background:rgba(34,211,160,.1);border:1px solid rgba(34,211,160,.2);color:var(--safe)}
        #how { padding: 6rem 4rem; background: linear-gradient(180deg,transparent,rgba(92,0,200,.05),transparent); }
        .steps-track { display: flex; gap: 0; max-width: 1100px; margin: 0 auto; position: relative; align-items: stretch; }
        .steps-track::before { content: ''; position: absolute; top: 44px; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg,transparent,var(--purple-500),transparent); z-index: 0; }
        .step { flex: 1; text-align: center; padding: 0 1.5rem; position: relative; z-index: 1; }
        .step-circle { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; background: var(--panel); border: 2px solid var(--purple-500); box-shadow: 0 0 24px var(--purple-glow); font-size: 1.4rem; }
        .step-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: .5rem; }
        .step-desc { color: var(--muted); font-size: .85rem; line-height: 1.6; }
        #risk { padding: 6rem 4rem; }
        .risk-container { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .risk-visual { display: flex; flex-direction: column; gap: 1rem; padding: 2.5rem; background: var(--panel); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 40px 80px rgba(0,0,0,.4); }
        .risk-title-sm { font-family: 'JetBrains Mono',monospace; font-size: .75rem; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; margin-bottom: .5rem; }
        .risk-gauge { text-align: center; padding: 1.5rem 0; }
        .gauge-num { font-family: 'Syne',sans-serif; font-size: 5rem; font-weight: 800; background: linear-gradient(135deg,var(--warn),var(--danger)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .gauge-label { font-size: 1rem; font-weight: 700; color: var(--warn); letter-spacing: .12em; text-transform: uppercase; margin-top: .3rem; }
        .risk-bar-wrap { background: rgba(255,255,255,.05); border-radius: 100px; height: 8px; overflow: hidden; margin-bottom: 1.2rem; }
        .risk-bar { height: 100%; border-radius: 100px; background: linear-gradient(90deg,var(--safe),var(--warn),var(--danger)); width: 67%; }
        .finding-row { display: flex; align-items: center; justify-content: space-between; padding: .7rem 1rem; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); margin-bottom: .5rem; }
        .finding-left { display: flex; align-items: center; gap: .8rem; font-size: .88rem; }
        .sev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sev-crit{background:var(--danger);box-shadow:0 0 8px var(--danger)}.sev-high{background:var(--warn)}.sev-med{background:#facc15}.sev-low{background:var(--safe)}
        .sev-badge { font-size: .7rem; font-family: 'JetBrains Mono',monospace; padding: .15rem .5rem; border-radius: 5px; font-weight: 600; }
        .badge-crit{background:rgba(255,77,109,.2);color:var(--danger)}.badge-high{background:rgba(249,115,22,.2);color:var(--warn)}.badge-med{background:rgba(250,204,21,.2);color:#facc15}.badge-low{background:rgba(34,211,160,.2);color:var(--safe)}
        .risk-explain h3 { font-family: 'Syne',sans-serif; font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -.02em; }
        .risk-explain p { color: var(--muted); line-height: 1.75; margin-bottom: 1.5rem; }
        .owasp-list { display: flex; flex-direction: column; gap: .6rem; }
        .owasp-item { display: flex; gap: 1rem; align-items: center; padding: .8rem 1rem; border-radius: 10px; background: rgba(138,43,226,.07); border: 1px solid var(--border); }
        .owasp-tag { font-family: 'JetBrains Mono',monospace; font-size: .75rem; color: var(--purple-300); font-weight: 600; white-space: nowrap; }
        .owasp-name { font-size: .85rem; color: var(--muted); }
        #tech { padding: 6rem 4rem; }
        .tech-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 1rem; max-width: 1000px; margin: 0 auto; }
        .tech-pill { padding: 1rem; border-radius: 14px; text-align: center; background: var(--panel); border: 1px solid var(--border); transition: all .3s; cursor: default; }
        .tech-pill:hover { border-color: var(--purple-400); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(138,43,226,.2); }
        .tech-icon { font-size: 1.8rem; margin-bottom: .5rem; }
        .tech-name { font-size: .82rem; font-weight: 600; }
        .tech-role { font-size: .72rem; color: var(--muted); margin-top: .2rem; }
        #features { padding: 6rem 4rem; }
        .bento { display: grid; grid-template-columns: repeat(6,1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
        .bento-card { background: var(--panel); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; transition: all .35s; position: relative; overflow: hidden; }
        .bento-card:hover { border-color: var(--purple-500); box-shadow: 0 16px 48px rgba(138,43,226,.2); transform: translateY(-4px); }
        .b1{grid-column:span 3}.b2{grid-column:span 3}.b3{grid-column:span 2}.b4{grid-column:span 2}.b5{grid-column:span 2}
        .bento-icon { font-size: 2.2rem; margin-bottom: 1rem; }
        .bento-title { font-family: 'Syne',sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: .5rem; }
        .bento-desc { color: var(--muted); font-size: .88rem; line-height: 1.65; }
        .bento-big-stat { font-family: 'Syne',sans-serif; font-size: 3.5rem; font-weight: 800; margin-top: 1rem; background: linear-gradient(135deg,var(--purple-300),var(--neon)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        #install { padding: 6rem 4rem; }
        .install-container { max-width: 800px; margin: 0 auto; text-align: center; }
        .code-block { margin-top: 2.5rem; background: rgba(13,13,26,.95); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.5); text-align: left; }
        .code-header { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.4rem; background: rgba(255,255,255,.03); border-bottom: 1px solid var(--border); }
        .code-lang { font-family: 'JetBrains Mono',monospace; font-size: .75rem; color: var(--purple-300); }
        .code-copy { font-size: .75rem; color: var(--muted); cursor: pointer; transition: color .2s; background: none; border: none; }
        .code-copy:hover { color: var(--white); }
        .code-body { padding: 1.5rem 1.8rem; font-family: 'JetBrains Mono',monospace; font-size: .85rem; line-height: 2; }
        .c-dollar{color:var(--purple-400);user-select:none}.c-cmd{color:var(--white)}.c-arg{color:var(--purple-300)}.c-out{color:var(--muted)}.c-ok{color:var(--safe)}
        #cta { padding: 8rem 4rem; text-align: center; background: linear-gradient(180deg,transparent,rgba(92,0,200,.08),transparent); }
        .cta-glow { width: 600px; height: 300px; border-radius: 50%; background: radial-gradient(ellipse,rgba(138,43,226,.25),transparent 70%); margin: 0 auto -150px; filter: blur(40px); }
        .cta-title { font-family: 'Syne',sans-serif; font-size: clamp(2.5rem,5vw,4.5rem); font-weight: 800; letter-spacing: -.03em; margin-bottom: 1.2rem; line-height: 1.05; }
        .cta-sub { color: var(--muted); font-size: 1.05rem; margin-bottom: 2.5rem; max-width: 480px; margin-left: auto; margin-right: auto; }
        .cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-large { padding: 1rem 2.5rem; background: linear-gradient(135deg,var(--purple-500),var(--violet)); color: #fff; border: none; border-radius: 14px; font-family: 'Outfit',sans-serif; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: all .3s; text-decoration: none; display: inline-flex; align-items: center; gap: .6rem; box-shadow: 0 0 50px rgba(138,43,226,.5); }
        .btn-large:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 0 80px rgba(138,43,226,.75); }
        .btn-large-ghost { padding: 1rem 2.5rem; background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 14px; font-family: 'Outfit',sans-serif; font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: all .3s; text-decoration: none; display: inline-flex; align-items: center; gap: .6rem; }
        .btn-large-ghost:hover { border-color: var(--purple-400); color: var(--white); background: rgba(138,43,226,.1); transform: translateY(-3px); }
        footer { border-top: 1px solid var(--border); padding: 2.5rem 4rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: rgba(8,8,16,.8); backdrop-filter: blur(20px); }
        .footer-left { display: flex; align-items: center; gap: 1.5rem; }
        .footer-links { display: flex; gap: 1.5rem; list-style: none; }
        .footer-links a { color: var(--muted); font-size: .85rem; text-decoration: none; transition: color .2s; }
        .footer-links a:hover { color: var(--purple-300); }
        .footer-right { color: var(--muted); font-size: .82rem; }
        .hackathon-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .9rem; background: rgba(138,43,226,.15); border: 1px solid var(--border); border-radius: 100px; font-size: .75rem; color: var(--purple-300); font-weight: 600; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .reveal { opacity: 0; transform: translateY(32px); transition: opacity .7s ease, transform .7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--black); }
        ::-webkit-scrollbar-thumb { background: var(--purple-700); border-radius: 6px; }
        @media (max-width: 900px) {
          nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          #modules,#how,#risk,#tech,#features,#install,#cta { padding: 4rem 1.5rem; }
          .risk-container { grid-template-columns: 1fr; }
          .steps-track { flex-direction: column; }
          .steps-track::before { display: none; }
          .bento { grid-template-columns: 1fr; }
          .b1,.b2,.b3,.b4,.b5 { grid-column: span 1; }
          footer { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
          .stats-strip { padding: 2rem 1rem; }
        }
      `}</style>

      {/* Custom cursor */}
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* Ambient */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-bg" />

      {/* ── NAV ── */}
      <nav>
        {/* Logo scrolls to top of page */}
        <a className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="logo-icon">⬡</div>
          SentinelAI
        </a>
        <ul className="nav-links">
          <li><a href="#modules">Modules</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#risk">Risk Scoring</a></li>
          <li><a href="#tech">Tech Stack</a></li>
          <li><a href="#install">Install</a></li>
        </ul>
        <div className="nav-cta">
          {/* GitHub — external link, opens new tab */}
          <a href={GITHUB_REPO} className="btn-ghost" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          {/* Dashboard — triggers GitHub OAuth, same flow as Login page */}
          <button className="btn-primary" onClick={handleLogin}>
            Launch Dashboard →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          AI Security · Open Source · 2026
        </div>
        <h1 className="hero-title">
          The VirusTotal
          <span>for AI Models</span>
        </h1>
        <p className="hero-sub">
          SentinelAI scans any HuggingFace model for security vulnerabilities, CVEs, misconfigurations, prompt injection weaknesses, and bias — delivering a single <strong style={{ color: 'var(--purple-300)' }}>0–100 risk score</strong> in one command.
        </p>
        <div className="hero-actions">
          {/* Scrolls to #install section on same page */}
          <a href="#install" className="btn-hero">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            pip install sentinelai
          </a>
          {/* Dashboard — triggers GitHub OAuth */}
          <button className="btn-hero-ghost" onClick={handleLogin}>
            View Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>
        <div className="terminal-wrap">
          <div className="terminal">
            <div className="terminal-bar">
              <span className="t-dot t-red" /><span className="t-dot t-yellow" /><span className="t-dot t-green" />
              <span className="t-title">bash — sentinelai scan</span>
            </div>
            <div className="terminal-body">
              <div><span className="t-comment"># Scan any HuggingFace model instantly</span></div>
              <div><span className="t-cmd">$ sentinelai scan meta-llama/Llama-3-8B</span></div>
              <div style={{ marginTop: '0.5rem' }}><span style={{ color: 'var(--neon)' }}>⬡ SentinelAI</span> <span className="t-muted">— scanning meta-llama/Llama-3-8B</span></div>
              <div style={{ height: '0.5rem' }} />
              <div><span className="t-pass">  ✓</span>  <span className="t-muted">Serialization scan .............. </span><span className="t-pass">PASSED</span></div>
              <div><span className="t-warn-c">  ⚠</span>  <span className="t-muted">Dependency CVE scan ............. </span><span className="t-warn-c">2 issues found</span></div>
              <div><span className="t-fail">  ✗</span>  <span className="t-muted">Config audit ..................... </span><span className="t-fail">trust_remote_code=true</span></div>
              <div><span className="t-fail">  ✗</span>  <span className="t-muted">Behavioral probe ................. </span><span className="t-fail">3/20 attacks succeeded</span></div>
              <div><span className="t-pass">  ✓</span>  <span className="t-muted">Bias check ....................... </span><span className="t-pass">No significant disparity</span></div>
              <div style={{ height: '0.5rem' }} />
              <div className="t-muted">  ──────────────────────────────────</div>
              <div>  <span className="t-score">RISK SCORE: 67 / 100</span> → <span className="t-label">HIGH ⚠</span></div>
              <div className="t-muted">  3 critical findings · 2 medium · 1 low</div>
              <div style={{ height: '0.5rem' }} />
              <div className="t-muted">  → Saved: <span style={{ color: 'var(--purple-300)' }}>llama3-report.html</span></div>
              <div className="t-muted">  → Dashboard: <span style={{ color: 'var(--purple-300)' }}>sentinelai.vercel.app/scans/a3f9d2...</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-strip reveal">
        <div className="stat-item"><div className="stat-num">5</div><div className="stat-label">Security Scan Modules</div></div>
        <div className="stat-item"><div className="stat-num">20</div><div className="stat-label">Adversarial Probe Attacks</div></div>
        <div className="stat-item"><div className="stat-num">0–100</div><div className="stat-label">Unified Risk Score</div></div>
        <div className="stat-item"><div className="stat-num">1</div><div className="stat-label">Command to Scan Any Model</div></div>
      </div>

      {/* ── FEATURES BENTO ── */}
      <section id="features">
        <div className="section-header reveal">
          <div className="section-eyebrow">Why SentinelAI</div>
          <h2 className="section-title">Everything you need to ship<br/>safe AI</h2>
        </div>
        <div className="bento">
          <div className="bento-card b1 reveal"><div className="bento-icon">🔍</div><div className="bento-title">5 Parallel Scan Modules</div><div className="bento-desc">Serialization, CVE, Config Audit, Behavioral Probe, and Bias Check — all run in parallel using asyncio so scans finish in seconds, not minutes.</div><div className="bento-big-stat">5×</div></div>
          <div className="bento-card b2 reveal"><div className="bento-icon">🌐</div><div className="bento-title">Web Dashboard + CLI</div><div className="bento-desc">Use the terminal or the full web dashboard with scan history, visual reports, severity breakdowns, and downloadable HTML/JSON reports — your choice.</div></div>
          <div className="bento-card b3 reveal"><div className="bento-icon">🤗</div><div className="bento-title">HuggingFace Native</div><div className="bento-desc">Scan any public model by ID — no manual download needed. Supports local model folders too.</div></div>
          <div className="bento-card b4 reveal"><div className="bento-icon">🔐</div><div className="bento-title">GitHub OAuth</div><div className="bento-desc">One login — your CLI token and web dashboard share the exact same session.</div></div>
          <div className="bento-card b5 reveal"><div className="bento-icon">📄</div><div className="bento-title">CI/CD Ready Reports</div><div className="bento-desc">JSON output is structured for automated pipelines. HTML reports are shareable with stakeholders.</div></div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules">
        <div className="section-header reveal">
          <div className="section-eyebrow">Scan Engine</div>
          <h2 className="section-title">Five modules. One score.<br/>Complete coverage.</h2>
          <p className="section-sub">Each module maps directly to OWASP LLM Top 10 and EU AI Act requirements — giving you audit-ready results.</p>
        </div>
        <div className="modules-grid">
          {[
            { num: 'MODULE 01', icon: 'ic-blue', title: 'Serialization Scanner', desc: <span>Reads model files byte-by-byte hunting for hidden code execution signatures — <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--purple-300)' }}>os.system</code>, <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--purple-300)' }}>exec</code>, network calls. Legacy pickle files are flagged immediately.</span>, tag: 'tag-supply', tagText: 'OWASP LLM03 — Supply Chain', svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            { num: 'MODULE 02', icon: 'ic-orange', title: 'Dependency CVE Scanner', desc: <span>Downloads the model's <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--purple-300)' }}>requirements.txt</code> from HuggingFace and cross-references every library version against the public CVE database. Returns CVE IDs, severity, and exact upgrade commands.</span>, tag: 'tag-supply', tagText: 'OWASP LLM03 — Supply Chain', svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
            { num: 'MODULE 03', icon: 'ic-purple', title: 'Config Auditor', desc: <span>Reads <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--purple-300)' }}>config.json</code> and runs a full security checklist. Flags <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--danger)' }}>trust_remote_code: true</code>, missing model cards, missing licenses, and tokenizer misconfigurations.</span>, tag: 'tag-config', tagText: 'OWASP LLM07 — System Prompt Leakage', svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-4"/><polyline points="9 8 12 5 15 8"/><line x1="12" y1="5" x2="12" y2="14"/></svg> },
            { num: 'MODULE 04', icon: 'ic-red', title: 'Behavioral Probe', desc: 'Acts as a penetration tester. Fires 20 adversarial prompts — jailbreak attempts, system prompt extraction, PII leakage tricks — at the model via HuggingFace Inference API. Evaluates success via regex matching on outputs.', tag: 'tag-prompt', tagText: 'OWASP LLM01 — Prompt Injection', svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { num: 'MODULE 05', icon: 'ic-green', title: 'Bias Quick-Check', desc: 'Sends demographically varied probe pairs — same question, different names and genders — and compares sentiment scores on outputs. Significant divergence is flagged as a potential bias signal.', tag: 'tag-bias', tagText: 'EU AI Act — Article 10 (Data Governance)', svg: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
          ].map(m => (
            <div className="module-card reveal" key={m.num}>
              <div className="module-num">{m.num}</div>
              <div className={`module-icon ${m.icon}`}>{m.svg}</div>
              <div className="module-title">{m.title}</div>
              <div className="module-desc">{m.desc}</div>
              <span className={`module-tag ${m.tag}`}>{m.tagText}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how">
        <div className="section-header reveal">
          <div className="section-eyebrow">Process</div>
          <h2 className="section-title">From scan to report<br/>in seconds</h2>
        </div>
        <div className="steps-track reveal">
          {[
            { icon: '⬡', title: 'Run the CLI', desc: <span>One command — <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--purple-300)' }}>sentinelai scan &lt;model-id&gt;</code> — kicks off the scan engine.</span> },
            { icon: '⚡', title: 'Parallel Scan', desc: 'All 5 modules run simultaneously via asyncio against HuggingFace Hub.' },
            { icon: '📊', title: 'Risk Score', desc: 'Findings are weighted by severity and OWASP category into a 0–100 score.' },
            { icon: '📄', title: 'Get Reports', desc: 'HTML report for humans. JSON for CI/CD. Both saved locally and to the dashboard.' },
            { icon: '🔒', title: 'Ship Safe', desc: 'Fix findings with remediation steps included in every card. Re-scan to verify.' },
          ].map(s => (
            <div className="step" key={s.title}>
              <div className="step-circle">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RISK SCORING ── */}
      <section id="risk">
        <div className="section-header reveal">
          <div className="section-eyebrow">Risk Engine</div>
          <h2 className="section-title">One number tells<br/>the whole story</h2>
        </div>
        <div className="risk-container reveal">
          <div className="risk-visual">
            <div className="risk-title-sm">LIVE SCAN RESULT — meta-llama/Llama-3-8B</div>
            <div className="risk-gauge"><div className="gauge-num">67</div><div className="gauge-label">⚠ HIGH RISK</div></div>
            <div className="risk-bar-wrap"><div className="risk-bar" /></div>
            {[
              { dot: 'sev-crit', text: 'trust_remote_code=true in config.json', badge: 'badge-crit', label: 'CRITICAL' },
              { dot: 'sev-crit', text: '3/20 adversarial probes succeeded', badge: 'badge-crit', label: 'CRITICAL' },
              { dot: 'sev-high', text: 'CVE-2024-8397 in transformers==4.38.0', badge: 'badge-high', label: 'HIGH' },
              { dot: 'sev-med', text: 'Missing model card documentation', badge: 'badge-med', label: 'MEDIUM' },
              { dot: 'sev-low', text: 'No license file detected', badge: 'badge-low', label: 'LOW' },
            ].map(f => (
              <div className="finding-row" key={f.text}>
                <div className="finding-left"><div className={`sev-dot ${f.dot}`} />{f.text}</div>
                <span className={`sev-badge ${f.badge}`}>{f.label}</span>
              </div>
            ))}
          </div>
          <div className="risk-explain">
            <h3>OWASP-aligned scoring</h3>
            <p>Every finding is weighted by severity and amplified by its OWASP LLM Top 10 category multiplier. The final 0–100 score maps to SAFE / LOW / MEDIUM / HIGH / CRITICAL.</p>
            <p>Scores under 20 are safe to deploy. Anything above 60 means <strong style={{ color: 'var(--danger)' }}>don't ship it</strong>.</p>
            <div className="owasp-list">
              {[
                { tag: 'LLM01 ×1.5', name: 'Prompt Injection — highest weighted category' },
                { tag: 'LLM07 ×1.3', name: 'System Prompt Leakage — config misconfigurations' },
                { tag: 'LLM03 ×1.0', name: 'Supply Chain — serialization + CVE findings' },
                { tag: 'EU AI Act', name: 'Article 10 — Bias and data governance signals' },
              ].map(o => (
                <div className="owasp-item" key={o.tag}>
                  <span className="owasp-tag">{o.tag}</span>
                  <span className="owasp-name">{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="tech">
        <div className="section-header reveal">
          <div className="section-eyebrow">Technology</div>
          <h2 className="section-title">Modern stack.<br/>Built to scale.</h2>
        </div>
        <div className="tech-grid reveal">
          {[
            { icon: '🐍', name: 'Python', role: 'CLI + Backend' },
            { icon: '⚡', name: 'FastAPI', role: 'REST API' },
            { icon: '⚛️', name: 'React 18', role: 'Dashboard' },
            { icon: '🐘', name: 'PostgreSQL', role: 'Neon DB' },
            { icon: '🤗', name: 'HuggingFace', role: 'Model Hub' },
            { icon: '🔍', name: 'modelscan', role: 'Serialization' },
            { icon: '🛡️', name: 'pip-audit', role: 'CVE Scanning' },
            { icon: '🔑', name: 'GitHub OAuth', role: 'Auth + JWT' },
            { icon: '▲', name: 'Vercel', role: 'Frontend' },
            { icon: '🚀', name: 'Render', role: 'Backend' },
          ].map(t => (
            <div className="tech-pill" key={t.name}>
              <div className="tech-icon">{t.icon}</div>
              <div className="tech-name">{t.name}</div>
              <div className="tech-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSTALL ── */}
      <section id="install">
        <div className="install-container reveal">
          <div className="section-eyebrow">Get Started</div>
          <h2 className="section-title" style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Three commands.<br/>Full security scan.</h2>
          <div className="code-block">
            <div className="code-header">
              <span className="code-lang">bash</span>
              <button className="code-copy" onClick={copyCode}>⎘ Copy</button>
            </div>
            <div className="code-body">
              <div><span className="c-dollar">$ </span><span className="c-cmd">pip install </span><span className="c-arg">sentinelai</span></div>
              <div><span className="c-dollar">$ </span><span className="c-cmd">sentinelai </span><span className="c-arg">login</span></div>
              <div><span className="c-dollar">$ </span><span className="c-cmd">sentinelai </span><span className="c-arg">scan </span><span style={{ color: 'var(--info)' }}>meta-llama/Llama-3-8B</span></div>
              <div style={{ marginTop: '0.5rem' }} className="c-out"># ↓ Scan runs in parallel across all 5 modules</div>
              <div className="c-ok">✓  Serialization scan .............. PASSED</div>
              <div style={{ color: 'var(--warn)' }}>⚠  Dependency CVE scan ............. 2 issues found</div>
              <div style={{ color: 'var(--danger)' }}>✗  Config audit ..................... trust_remote_code=true</div>
              <div style={{ color: 'var(--danger)' }}>✗  Behavioral probe ................. 3/20 attacks succeeded</div>
              <div className="c-ok">✓  Bias check ....................... No significant disparity</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--neon)', fontWeight: 700 }}>   RISK SCORE: 67 / 100  →  HIGH ⚠</div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
            Requires Python 3.10+ · Works on macOS, Linux, Windows ·{' '}
            <a href={GITHUB_REPO} style={{ color: 'var(--purple-300)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">Full docs on GitHub →</a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta">
        <div className="cta-glow" />
        <div className="reveal">
          <h2 className="cta-title">
            Don't deploy blind.<br/>
            <span style={{ background: 'linear-gradient(135deg,var(--purple-300),var(--neon))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Scan before you ship.
            </span>
          </h2>
          <p className="cta-sub">AI models go into hospitals, banks, and hiring systems every day without a single security check. SentinelAI changes that.</p>
          <div className="cta-actions">
            {/* Primary CTA — triggers GitHub OAuth, lands on dashboard */}
            <button className="btn-large" onClick={handleLogin}>
              Open Dashboard →
            </button>
            <a href={GITHUB_REPO} className="btn-large-ghost" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-left">
          <a className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ fontSize: '1rem' }}>
            <div className="logo-icon" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>⬡</div>
            SentinelAI
          </a>
          <ul className="footer-links">
            <li><a href="/api-docs">API Docs</a></li>
            <li><a href="https://pypi.org/project/sentinelai" target="_blank" rel="noopener noreferrer">PyPI</a></li>
            <li><a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="/developers">Developers</a></li>
          </ul>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="footer-right" style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.82rem' }}>MIT License · SentinelAI 2026</span>
        </div>
      </footer>
    </>
  )
}