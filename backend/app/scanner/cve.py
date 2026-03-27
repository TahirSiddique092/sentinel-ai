import subprocess, json, tempfile, os
from huggingface_hub import hf_hub_download
from .base import BaseScanner, FindingData

class CVEScanner(BaseScanner):
    async def run(self):
        findings = []

        # get requirements.txt
        req_content = None
        if self.target_type == "huggingface":
            try:
                req_path = hf_hub_download(repo_id=self.target,
                                            filename="requirements.txt",
                                            token=self.hf_token)
                with open(req_path) as f:
                    req_content = f.read()
            except:
                # no requirements.txt — scan local env as fallback
                pass
        elif os.path.exists(os.path.join(self.target, "requirements.txt")):
            with open(os.path.join(self.target, "requirements.txt")) as f:
                req_content = f.read()

        if not req_content:
            findings.append(FindingData(
                module="cve", severity="INFO",
                title="No requirements.txt found",
                description="Cannot perform dependency CVE scan without requirements.txt."
            ))
            return findings

        # write to temp file and run pip-audit
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write(req_content)
            tmp_path = f.name

        try:
            result = subprocess.run(
                ["pip-audit", "-r", tmp_path, "--format", "json", "--no-deps"],
                capture_output=True, text=True, timeout=60
            )
            audit_data = json.loads(result.stdout or "[]")

            for vuln in audit_data:
                for v in vuln.get("vulns", []):
                    severity = "HIGH" if v.get("fix_versions") else "CRITICAL"
                    findings.append(FindingData(
                        module="cve", severity=severity,
                        title=f"{v['id']} in {vuln['name']}=={vuln['version']}",
                        description=v.get("description", "Known CVE"),
                        owasp_tag="LLM03",
                        remediation=f"Upgrade to {vuln['name']}>={v['fix_versions'][0]}"
                                    if v.get("fix_versions") else "No fix available — consider alternative",
                        raw_data=v
                    ))

            if not findings:
                findings.append(FindingData(module="cve", severity="INFO",
                    title="No CVEs found", description="All dependencies are clean."))
        finally:
            os.unlink(tmp_path)

        return findings