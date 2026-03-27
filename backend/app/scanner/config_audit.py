from huggingface_hub import hf_hub_download, HfApi
import json, httpx
from .base import BaseScanner, FindingData

class ConfigAuditor(BaseScanner):
    async def run(self):
        findings = []
        if self.target_type != "huggingface":
            return findings

        api = HfApi(token=self.hf_token)

        # 1. Download config.json
        try:
            config_path = hf_hub_download(repo_id=self.target, filename="config.json",
                                           token=self.hf_token)
            with open(config_path) as f:
                config = json.load(f)
        except Exception:
            findings.append(FindingData(
                module="config", severity="MEDIUM",
                title="No config.json found",
                description="The model has no config.json. Cannot perform config audit.",
                owasp_tag="LLM07"
            ))
            return findings

        # 2. Check trust_remote_code
        if config.get("trust_remote_code"):
            findings.append(FindingData(
                module="config", severity="CRITICAL",
                title="trust_remote_code enabled",
                description=("config.json sets trust_remote_code: true. This executes arbitrary "
                             "Python code from the model repo at load time — a severe supply chain risk."),
                owasp_tag="LLM03",
                remediation="Remove trust_remote_code from config.json. Fork the repo and manually audit custom code."
            ))

        # 3. Check for model card (README.md)
        try:
            hf_hub_download(repo_id=self.target, filename="README.md", token=self.hf_token)
        except:
            findings.append(FindingData(
                module="config", severity="MEDIUM",
                title="No model card (README.md)",
                description="No model card found. Missing training data, license, and limitations docs.",
                owasp_tag="EU-Art13",
                remediation="Add a README.md following HuggingFace model card template."
            ))

        # 4. Check license
        model_info = api.model_info(self.target, token=self.hf_token)
        if not model_info.cardData or not model_info.cardData.get("license"):
            findings.append(FindingData(
                module="config", severity="LOW",
                title="No license declared",
                description="Model has no license in its model card. Unknown usage restrictions.",
                owasp_tag="LLM03",
                remediation="Add a license field to README.md YAML frontmatter."
            ))

        return findings