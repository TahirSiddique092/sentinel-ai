import click, webbrowser, threading, httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from rich.console import Console
from .config import save_config, get_api_url

console = Console()
_token_holder = {"token": None}

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        token = query.get("token", [None])[0]
        if token:
            _token_holder["token"] = token
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"<h2>Login successful! You can close this tab.</h2>")
            self.server._done = True

    def log_message(self, *args):
        pass  # suppress server logs

@click.command()
def login():
    """Authenticate with SentinelAI via GitHub."""
    api_url = get_api_url()

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
