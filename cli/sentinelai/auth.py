import click, webbrowser, threading, httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from rich.console import Console
from .config import save_config, get_api_url

console = Console()
_token_holder = {"token": None}

SUCCESS_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SentinelAI — Authenticated</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080810;
    color: #f0eaff;
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(138,43,226,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(138,43,226,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
  }
  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(92,0,200,0.3) 0%, transparent 70%);
    top: -200px; left: -150px;
  }
  .orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(138,43,226,0.18) 0%, transparent 70%);
    bottom: -100px; right: -100px;
  }

  .card {
    position: relative;
    z-index: 1;
    background: rgba(17,17,36,0.85);
    border: 1px solid rgba(138,43,226,0.25);
    border-radius: 20px;
    padding: 3rem 3.5rem;
    text-align: center;
    max-width: 420px;
    width: 90%;
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(138,43,226,0.08);
    animation: fadeUp 0.5s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 2rem;
  }

  .logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #8a2be2, #bf5fff);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 0 20px rgba(138,43,226,0.5);
  }

  .logo-text {
    font-family: 'Syne', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #f0eaff;
  }

  .check-wrap {
    width: 64px; height: 64px;
    background: rgba(34,211,160,0.1);
    border: 1px solid rgba(34,211,160,0.3);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
    animation: popIn 0.4s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }

  .check-wrap svg {
    stroke: #22d3a0;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    width: 28px; height: 28px;
    animation: drawCheck 0.35s 0.5s ease both;
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
  }

  @keyframes drawCheck {
    to { stroke-dashoffset: 0; }
  }

  h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
    color: #f0eaff;
  }

  .subtitle {
    font-size: 0.88rem;
    color: rgba(240,234,255,0.5);
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .terminal-hint {
    background: rgba(8,8,16,0.8);
    border: 1px solid rgba(138,43,226,0.2);
    border-radius: 10px;
    padding: 0.9rem 1.2rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    color: rgba(240,234,255,0.45);
    text-align: left;
    line-height: 1.8;
  }

  .terminal-hint .g { color: #22d3a0; }
  .terminal-hint .p { color: #c084fc; }

  .close-note {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: rgba(240,234,255,0.25);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>

<div class="orb orb-1"></div>
<div class="orb orb-2"></div>

<div class="card">

  <div class="logo-wrap">
    <div class="logo-icon">⬡</div>
    <span class="logo-text">SentinelAI</span>
  </div>

  <div class="check-wrap">
    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
  </div>

  <h1>Authentication successful</h1>
  <p class="subtitle">You're now logged in. Head back to your terminal — your session is ready.</p>

  <div class="terminal-hint">
    <div><span class="g">✓</span> Token saved to <span class="p">~/.sentinelai/config.json</span></div>
    <div><span class="g">→</span> Run your first scan:</div>
    <div style="padding-left:1rem;color:rgba(240,234,255,0.65)">sentinelai scan distilbert-base-uncased</div>
  </div>

  <p class="close-note">You can safely close this tab</p>

</div>

</body>
</html>"""

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        token = query.get("token", [None])[0]
        
        if token:
            _token_holder["token"] = token
            
            # Send 200 OK with HTML content
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            # Write the styled HTML
            self.wfile.write(SUCCESS_PAGE.encode("utf-8"))
            
            # Mark server as done to stop the loop
            self.server._done = True
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Authentication failed: No token received.")

    def log_message(self, *args):
        pass  # suppress server logs from cluttering the CLI

@click.command()
@click.option("--api-url", default=None, help="Override API URL (e.g. http://localhost:8000)")
def login(api_url):
    """Authenticate with SentinelAI via GitHub."""
    api_url = api_url or get_api_url()
    save_config({"api_url": api_url, "token": None})

    server = HTTPServer(("localhost", 9876), CallbackHandler)
    server._done = False

    def serve_until_done():
        while not server._done:
            server.handle_request()

    thread = threading.Thread(target=serve_until_done, daemon=True)
    thread.start()

    auth_url = f"{api_url}/auth/github?redirect_uri=http://localhost:9876/callback"
    console.print(f"[cyan]Opening browser for GitHub login...[/cyan]")
    webbrowser.open(auth_url)
    console.print("[dim]Waiting for authentication...[/dim]")
    thread.join(timeout=120)

    token = _token_holder["token"]
    if not token:
        console.print("[red]✗ Login timed out or failed[/red]")
        return

    resp = httpx.get(f"{api_url}/auth/me", headers={"Authorization": f"Bearer {token}"})
    user = resp.json()
    save_config({"api_url": api_url, "token": token})
    console.print(f"[green]✓ Logged in as[/green] [bold]{user['github_username']}[/bold]")
