import tempfile, os
from huggingface_hub import snapshot_download
from modelscan.modelscan import ModelScan
from .base import BaseScanner, FindingData

class SerializationScanner(BaseScanner):
    async def run(self):
        findings = []
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                if self.target_type == "huggingface":
                    path = snapshot_download(self.target, local_dir=tmpdir,
                                            token=self.hf_token,
                                            ignore_patterns=["*.gguf", "*.bin"])  # skip huge weights
                else:
                    path = self.target

                scanner = ModelScan()
                scanner.scan(path)

                if scanner.issues:
                    for issue in scanner.issues:
                        findings.append(FindingData(
                            module="serialization", severity="CRITICAL",
                            title=f"Malicious code in {issue.source.name}",
                            description=f"ModelScan detected: {issue.description}",
                            owasp_tag="LLM03",
                            remediation="Do NOT load this model. Convert to safetensors format from a trusted source.",
                            raw_data={"file": issue.source.name, "detail": issue.description}
                        ))
                else:
                    findings.append(FindingData(
                        module="serialization", severity="INFO",
                        title="Serialization scan passed",
                        description="No malicious code found in model files."
                    ))
        except Exception as e:
            findings.append(FindingData(
                module="serialization", severity="MEDIUM",
                title="Serialization scan failed",
                description=f"Could not complete scan: {str(e)}",
            ))
        return findings