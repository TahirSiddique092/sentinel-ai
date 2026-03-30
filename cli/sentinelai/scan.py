import click, httpx, time
from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich import box
from .config import get_token, get_api_url

console = Console()

SEVERITY_COLORS = {
    "CRITICAL": "bold red",
    "HIGH": "red",
    "MEDIUM": "yellow",
    "LOW": "blue",
    "INFO": "dim",
}
RISK_COLORS = {
    "LOW": "green",
    "MEDIUM": "yellow",
    "HIGH": "red",
    "CRITICAL": "bold red",
}

def make_status_table(scan_data: dict) -> Table:
    modules = scan_data.get("modules_status", {})
    table = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
    table.add_column("Module", style="dim")
    table.add_column("Status")
    icons = {
        "complete": "[green]✓[/green]",
        "running": "[cyan]⟳[/cyan]",
        "pending": "[dim]·[/dim]",
        "failed": "[red]✗[/red]",
        "skipped": "[dim]—[/dim]",
    }
    names = {
        "serialization": "Serialization scan",
        "cve": "Dependency CVE scan",
        "config": "Config audit",
        "behavioral": "Behavioral probe",
        "bias": "Bias check",
    }
    for key, label in names.items():
        status = modules.get(key, "pending")
        table.add_row(label, f"{icons.get(status, '?')} {status}")
    return table

@click.command()
@click.argument("target")
@click.option("--hf-token", default=None, help="HuggingFace token for private models")
@click.option("--output-dir", default=".", help="Directory to save reports")
def scan(target, hf_token, output_dir):
    """Scan a model. TARGET is a HuggingFace model ID or local path."""
    token = get_token()
    if not token:
        console.print("[red]Not logged in. Run: sentinelai login[/red]")
        return

    api_url = get_api_url()
    headers = {"Authorization": f"Bearer {token}"}
    target_type = "local" if target.startswith("/") else "huggingface"

    console.print(f"\n[cyan]⬡[/cyan] SentinelAI — scanning [bold]{target}[/bold]\n")
    resp = httpx.post(
        f"{api_url}/scans",
        json={"target": target, "target_type": target_type, "hf_token": hf_token},
        headers=headers,
        timeout=30,
    )
    if resp.status_code == 404:
        try:
            detail = resp.json().get("detail", "Model not found.")
        except Exception:
            detail = "Model not found on HuggingFace."
        console.print(f"\n[red]✗ {detail}[/red]")
        return
    if resp.status_code == 503:
        console.print(f"\n[yellow]✗ Could not reach HuggingFace. Check your connection.[/yellow]")
        return
    if resp.status_code != 202:
        console.print(f"[red]✗ Failed to start scan: {resp.text}[/red]")
        return

    scan_id = resp.json()["scan_id"]

    with Live(console=console, refresh_per_second=2) as live:
        while True:
            try:
                r = httpx.get(f"{api_url}/scans/{scan_id}", headers=headers, timeout=30)
                data = r.json()
                status = data["status"]
                live.update(Panel(make_status_table(data), title=f"[cyan]Scanning {target}[/cyan]"))
                if status in ("complete", "failed"):
                    break
            except (httpx.ReadTimeout, httpx.ConnectError):
                pass  # server busy during download — keep waiting
            time.sleep(3)

    if data["status"] == "failed":
        console.print(f"[red]✗ Scan failed: {data.get('error_message', 'Unknown error')}[/red]")
        return

    score = data["risk_score"]
    label = data["risk_label"]
    color = RISK_COLORS.get(label, "white")
    console.print(f"\n  RISK SCORE: [{color}]{score}/100 → {label}[/{color}]")

    counts = data["findings_count"]
    parts = [
        f"[red]{counts.get('CRITICAL', 0)} critical[/red]",
        f"[yellow]{counts.get('HIGH', 0)} high[/yellow]",
        f"[blue]{counts.get('MEDIUM', 0)} medium[/blue]",
    ]
    console.print("  " + " · ".join(parts))

    for fmt in ("json", "html"):
        r = httpx.get(f"{api_url}/scans/{scan_id}/report?format={fmt}", headers=headers)
        slug = target.replace("/", "-")
        path = f"{output_dir}/{slug}-report.{fmt}"
        with open(path, "w") as f:
            f.write(r.text)
        console.print(f"  [dim]→ Saved: {path}[/dim]")

    console.print(f"\n  [dim]Scan ID: {scan_id}[/dim]")
    console.print(f"  [dim]Dashboard: https://sentinel-ai-azure.vercel.app/scans/{scan_id}[/dim]\n")
