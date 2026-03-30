# SentinelAI CLI

**The VirusTotal for AI Models** — scan any HuggingFace model for security vulnerabilities in one command.

## Features

- 🛡️ **Serialization Scanner** — detects hidden code execution in model files
- 📦 **CVE Scanner** — cross-references dependencies against the CVE database
- ⚙️ **Config Auditor** — flags dangerous settings like `trust_remote_code`
- 💉 **Behavioral Probe** — tests for prompt injection and jailbreak vulnerabilities
- ⚖️ **Bias Check** — detects demographic bias in model outputs
- 📊 **Risk Score** — unified 0–100 score mapped to OWASP LLM Top 10

## Install

```bash
pip install sentinelai
```

## Quick Start

```bash
# 1. Log in via GitHub OAuth
sentinelai login

# 2. Scan any HuggingFace model
sentinelai scan meta-llama/Llama-3-8B

# 3. Log out when done
sentinelai logout
```

## Commands

| Command | Description |
|---------|-------------|
| `sentinelai login` | Authenticate via GitHub OAuth |
| `sentinelai scan <model>` | Scan a model (HuggingFace ID or local path) |
| `sentinelai logout` | Remove stored credentials |

### Scan Options

```bash
sentinelai scan meta-llama/Llama-3-8B \
  --hf-token hf_xxx... \      # For private models
  --output-dir ./reports       # Save reports here
```

## Output

After scanning, you get:
- **Terminal output** with live progress and risk score
- **JSON report** for CI/CD pipelines
- **HTML report** for human-readable sharing
- **Dashboard link** to view results on the web

## Requirements

- Python 3.10+
- Works on macOS, Linux, and Windows

## Links

- 🌐 [Web Dashboard](https://sentinelai.azure.vercel.app)
- 📖 [GitHub Repository](https://github.com/TahirSiddique092/sentinel-ai)
- 🐛 [Report Issues](https://github.com/TahirSiddique092/sentinel-ai/issues)

## License

MIT
