import click
import httpx
from rich.console import Console
from .config import load_config, save_config, clear_token

console = Console()


@click.command()
def logout():
    """Log out and remove stored credentials."""
    config = load_config()
    token = config.get("token")
    api_url = config.get("api_url", "")

    if not token:
        console.print("[yellow]You are not logged in.[/yellow]")
        return

    # Best-effort server-side token revocation
    try:
        httpx.post(
            f"{api_url}/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
    except Exception:
        pass  # Server may be unreachable — still clear local token

    clear_token()
    console.print("[green]✓ Logged out successfully.[/green] Token removed from ~/.sentinelai/config.json")
