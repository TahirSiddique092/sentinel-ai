from typing import List
import json
from datetime import datetime, timezone

SEVERITY_COLORS = {
    "CRITICAL": "#ef4444", "HIGH": "#f87171",
    "MEDIUM": "#fbbf24", "LOW": "#60a5fa", "INFO": "#6b7280"
}

def generate_json_report(scan, findings: list) -> dict:
    counts = {}
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1
    return {
        "scan_id": str(scan.id), "target": scan.target,
        "risk_score": scan.risk_score, "risk_label": scan.risk_label,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "findings": [{
            "id": str(f.id), "module": f.module, "severity": f.severity,
            "title": f.title, "description": f.description,
            "owasp_tag": f.owasp_tag, "remediation": f.remediation
        } for f in findings],
        "summary": {"total_findings": len(findings), "by_severity": counts}
    }

def generate_html_report(scan, findings: list) -> str:
    rows = ""
    for f in findings:
        color = SEVERITY_COLORS.get(f.severity, "#6b7280")
        rows += f"""
        <div class="finding" style="border-left: 3px solid {color}; padding: 16px; margin: 12px 0; background: rgba(255,255,255,0.03); border-radius: 4px;">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
            <span style="color:{color};font-size:12px;font-weight:600">{f.severity}</span>
            <strong>{f.title}</strong>
            <span style="opacity:.4;font-size:11px">{f.module} · {f.owasp_tag}</span>
          </div>
          <p style="opacity:.7;font-size:14px">{f.description}</p>
          <p style="color:#34d399;font-size:13px;margin-top:8px"><strong>Fix:</strong> {f.remediation}</p>
        </div>"""

    risk_color = SEVERITY_COLORS.get(scan.risk_label, "#6b7280")
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>SentinelAI Report — {scan.target}</title>
<style>body{{background:#09090b;color:#e4e4e7;font-family:monospace;padding:40px;max-width:900px;margin:0 auto}}
h1{{color:#22d3ee;font-size:28px}}h2{{margin-top:32px;opacity:.7}}</style></head><body>
<h1>SentinelAI Security Report</h1>
<p>Target: <strong>{scan.target}</strong> | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
<div style="background:rgba(255,255,255,.05);padding:24px;border-radius:8px;margin:24px 0">
  <div style="font-size:36px;font-weight:700;color:{risk_color}">{scan.risk_score}/100</div>
  <div style="color:{risk_color};margin-top:4px">{scan.risk_label} RISK</div>
</div>
<h2>Findings</h2>{rows}
<p style="opacity:.3;margin-top:40px;font-size:12px">SentinelAI — AI Model Security Scanner</p>
</body></html>"""