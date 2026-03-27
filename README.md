<div align="center">

```
███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗      █████╗ ██╗
██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     ██╔══██╗██║
███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     ███████║██║
╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     ██╔══██║██║
███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗██║  ██║██║
╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝
```

**The VirusTotal for AI Models**

One command. Five security checks. A single risk score.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Built%20at-Hackathon%202026-FF6B6B?style=flat-square)]()

</div>

---

## What is SentinelAI?

AI models are deployed everywhere — in hospitals, banks, hiring systems — but nobody runs a security check before they go live. SentinelAI is an open-source CLI tool and web dashboard that scans any HuggingFace model (or local model folder) for security vulnerabilities, dependency CVEs, misconfigurations, prompt injection weaknesses, and bias signals — then gives you a single **0–100 risk score** and a full report.

```bash
pip install sentinelai
sentinelai login
sentinelai scan meta-llama/Llama-3-8B
```

```
⬡ SentinelAI — scanning meta-llama/Llama-3-8B

  ✓  Serialization scan .............. PASSED
  ⚠  Dependency CVE scan ............. 2 issues found
  ✗  Config audit ..................... trust_remote_code=true
  ✗  Behavioral probe ................. 3/20 attacks succeeded
  ✓  Bias check ....................... No significant disparity

  ──────────────────────────────────
  RISK SCORE: 67 / 100 → HIGH ⚠
  3 critical findings · 2 medium · 1 low

  → Saved: llama3-report.html
  → Saved: llama3-report.json
  → Dashboard: https://sentinelai.vercel.app/scans/a3f9d2...
```

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Scan Modules](#scan-modules)
- [Risk Scoring](#risk-scoring)
- [Getting Started](#getting-started)
- [CLI Reference](#cli-reference)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| 🔍 **5 Scan Modules** | Serialization, CVE, Config, Behavioral Probe, Bias Check |
| 📊 **Risk Scoring** | Weighted 0–100 score mapped to OWASP LLM Top 10 |
| 🖥️ **CLI** | `pip install sentinelai` — works on any machine |
| 🌐 **Web Dashboard** | Scan history, findings viewer, report downloads |
| 📄 **Reports** | HTML (human-readable) + JSON (CI/CD ready) |
| 🔐 **GitHub Auth** | One login — CLI and dashboard share the same session |
| 🤗 **HuggingFace Native** | Scan any public model by ID, no download required |

---

## Architecture

### System Overview

```mermaid
graph TB
    subgraph Clients
        CLI["CLI<br/>(click + rich)"]
        WEB["Web Dashboard<br/>(Vite + React)"]
    end

    subgraph Backend ["Backend (FastAPI — Render)"]
        API["API Router"]
        AUTH["GitHub OAuth + JWT"]
        SCAN["Scan Orchestrator<br/>(asyncio.gather)"]
    end

    subgraph Modules ["Scan Engine (parallel)"]
        M1["Serialization<br/>modelscan"]
        M2["CVE Scanner<br/>pip-audit"]
        M3["Config Audit<br/>hf-hub"]
        M4["Behavioral Probe<br/>HF Inference API"]
        M5["Bias Check<br/>sentiment diff"]
    end

    subgraph Storage
        DB[("PostgreSQL<br/>Neon DB")]
        HF["HuggingFace<br/>Hub"]
    end

    CLI -->|"Bearer JWT"| API
    WEB -->|"Bearer JWT"| API
    API --> AUTH
    API --> SCAN
    SCAN --> M1 & M2 & M3 & M4 & M5
    M1 & M2 & M3 --> HF
    M4 & M5 -->|"adversarial prompts"| HF
    SCAN --> DB
    AUTH --> DB
```

### Request Flow — `sentinelai scan`

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant API as FastAPI Backend
    participant Modules as Scan Engine
    participant DB as Neon DB
    participant HF as HuggingFace

    User->>CLI: sentinelai scan distilbert-base-uncased
    CLI->>API: POST /scans {target, hf_token}
    API->>DB: INSERT scan (status=pending)
    API-->>CLI: 202 {scan_id}
    API->>Modules: background_task(run_scan)

    loop Poll every 2s
        CLI->>API: GET /scans/{scan_id}
        API-->>CLI: {status, modules_status}
    end

    par All 5 modules run in parallel
        Modules->>HF: Download config.json
        Modules->>HF: Download requirements.txt
        Modules->>HF: Inference API (probe prompts)
    end

    Modules->>DB: INSERT findings
    Modules->>DB: UPDATE scan (status=complete, risk_score)

    CLI->>API: GET /scans/{scan_id}/report?format=html
    CLI->>API: GET /scans/{scan_id}/report?format=json
    API-->>CLI: Reports
    CLI->>User: Saves files + prints summary
```

### GitHub OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Browser
    participant API as FastAPI
    participant GitHub

    User->>CLI: sentinelai login
    CLI->>CLI: Spin up server on :9876
    CLI->>Browser: Open /auth/github?redirect_uri=localhost:9876
    Browser->>GitHub: OAuth authorize
    GitHub-->>Browser: Redirect /auth/callback?code=xxx
    Browser->>API: GET /auth/callback?code=xxx
    API->>GitHub: Exchange code → access_token
    GitHub-->>API: access_token
    API->>GitHub: GET /user (get profile)
    GitHub-->>API: {id, login, email, avatar_url}
    API->>API: Upsert user in DB, issue JWT
    API-->>CLI: Redirect localhost:9876?token=JWT
    CLI->>CLI: Save JWT to ~/.sentinelai/config.json
    CLI-->>User: ✓ Logged in as johndoe
```

---

## Scan Modules

```mermaid
graph LR
    INPUT["Model ID / Path"] --> ORCH["Scan Orchestrator"]

    ORCH --> S1["Module 1<br/>Serialization Scanner"]
    ORCH --> S2["Module 2<br/>CVE Scanner"]
    ORCH --> S3["Module 3<br/>Config Auditor"]
    ORCH --> S4["Module 4<br/>Behavioral Probe"]
    ORCH --> S5["Module 5<br/>Bias Check"]

    S1 -->|"findings"| SCORE["Risk Scorer"]
    S2 -->|"findings"| SCORE
    S3 -->|"findings"| SCORE
    S4 -->|"findings"| SCORE
    S5 -->|"findings"| SCORE

    SCORE --> HTML["HTML Report"]
    SCORE --> JSON["JSON Report"]
    SCORE --> DASH["Dashboard"]
```

### Module 1 — Serialization Scanner
Reads model files byte-by-byte looking for hidden code execution signatures (`os.system`, `exec`, network calls). Uses [`modelscan`](https://github.com/protectai/model-scan) under the hood. Legacy pickle files are flagged immediately; safetensors format is validated as safe.

**OWASP mapping:** `LLM03 — Supply Chain Vulnerabilities`

### Module 2 — Dependency CVE Scanner
Downloads the model's `requirements.txt` from HuggingFace and cross-references every library version against the public CVE database using [`pip-audit`](https://github.com/pypa/pip-audit). Returns CVE IDs, severity, and exact upgrade commands.

**OWASP mapping:** `LLM03 — Supply Chain Vulnerabilities`

### Module 3 — Config Auditor
Reads `config.json` and runs a security checklist. Flags `trust_remote_code: true` (executes arbitrary Python at load time), missing model cards, missing licenses, and tokenizer misconfigurations.

**OWASP mapping:** `LLM07 — System Prompt Leakage`

### Module 4 — Behavioral Probe
Acts as a penetration tester. Fires 20 adversarial prompts at the model via HuggingFace Inference API — jailbreak attempts, system prompt extraction, PII leakage tricks. Evaluates success via regex pattern matching on outputs.

> **Note:** Requires HuggingFace Inference API access. Skipped automatically for local path scans.

**OWASP mapping:** `LLM01 — Prompt Injection`

### Module 5 — Bias Quick-Check
Sends demographically varied probe pairs (same question, different names/genders) to the model and compares sentiment scores on the outputs. Significant divergence is flagged as a potential bias signal.

**OWASP mapping:** `EU AI Act — Article 10 (Data Governance)`

---

## Risk Scoring

```mermaid
graph LR
    F1["CRITICAL finding"] -->|"× 10 pts"| RAW
    F2["HIGH finding"] -->|"× 7 pts"| RAW
    F3["MEDIUM finding"] -->|"× 4 pts"| RAW
    F4["LOW finding"] -->|"× 1 pt"| RAW

    RAW["Raw Score"] --> MULT["Apply OWASP multiplier"]

    MULT -->|"LLM01 × 1.5"| NORM
    MULT -->|"LLM07 × 1.3"| NORM
    MULT -->|"LLM03 × 1.2"| NORM
    MULT -->|"others × 1.0"| NORM

    NORM["Normalize → 0–100"] --> LABEL

    LABEL -->|"0–25"| LOW["🟢 LOW"]
    LABEL -->|"26–50"| MED["🟡 MEDIUM"]
    LABEL -->|"51–75"| HIGH["🔴 HIGH"]
    LABEL -->|"76–100"| CRIT["🚨 CRITICAL"]
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend)
- A [Neon](https://neon.tech) account (free)
- A GitHub account (for OAuth app)
- A [HuggingFace](https://huggingface.co) account (free, for the HF token)

### 1. Clone the repo

```bash
git clone https://github.com/TahirSiddique092/sentinel-ai.git
cd sentinel-ai
```

### 2. Set up GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Set the callback URL to `http://localhost:8000/auth/callback` (for local dev)
3. Note your **Client ID** and **Client Secret**

### 3. Configure environment variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/sentinelai
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=run_openssl_rand_hex_32_to_generate
JWT_EXPIRE_DAYS=30
FRONTEND_URL=http://localhost:5173
HF_TOKEN=hf_your_optional_huggingface_token
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### 4. Start the backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 6. Install and use the CLI

```bash
cd cli
pip install -e .

sentinelai login
sentinelai scan distilbert-base-uncased
```

---

## CLI Reference

```
Usage: sentinelai [OPTIONS] COMMAND [ARGS]...

  SentinelAI — AI model security scanner.

Commands:
  login   Authenticate via GitHub OAuth.
  scan    Scan a model for security vulnerabilities.
```

### `sentinelai login`

Opens your browser for GitHub OAuth authentication. Saves a JWT token to `~/.sentinelai/config.json`.

```bash
sentinelai login
```

### `sentinelai scan TARGET [OPTIONS]`

Scans a model and outputs a risk score, findings, and saved reports.

```bash
# Scan a HuggingFace model by ID
sentinelai scan distilbert-base-uncased

# Scan a private model (requires HuggingFace token)
sentinelai scan org/private-model --hf-token hf_xxxxxxxxxxxx

# Scan a local model folder
sentinelai scan /path/to/my-model/

# Save reports to a specific directory
sentinelai scan distilbert-base-uncased --output-dir ./reports/
```

| Option | Default | Description |
|---|---|---|
| `TARGET` | — | HuggingFace model ID (`org/name`) or local path |
| `--hf-token` | None | HuggingFace read token (needed for private models) |
| `--output-dir` | `.` | Directory to save HTML and JSON reports |

---

## API Reference

All API routes are prefixed with the backend base URL. Authentication uses `Authorization: Bearer <JWT>` on all protected routes.

```mermaid
graph TD
    subgraph Public
        A1["GET /health"]
        A2["GET /auth/github"]
        A3["GET /auth/callback"]
    end

    subgraph Protected ["Protected (JWT required)"]
        B1["GET /auth/me"]
        B2["POST /scans"]
        B3["GET /scans"]
        B4["GET /scans/{id}"]
        B5["GET /scans/{id}/findings"]
        B6["GET /scans/{id}/report?format=json|html"]
        B7["GET /users/me"]
        B8["DELETE /users/me"]
    end
```

### Key endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/auth/github` | Start OAuth flow |
| `GET` | `/auth/callback` | OAuth callback — issues JWT |
| `GET` | `/auth/me` | Verify token, get current user |
| `POST` | `/scans` | Start a new scan (async) |
| `GET` | `/scans` | List all scans for current user |
| `GET` | `/scans/{id}` | Poll scan status + module progress |
| `GET` | `/scans/{id}/findings` | Get all findings for a scan |
| `GET` | `/scans/{id}/report` | Download HTML or JSON report |
| `GET` | `/users/me` | Get profile + scan stats |

### `POST /scans` — request body

```json
{
  "target": "meta-llama/Llama-3-8B",
  "target_type": "huggingface",
  "hf_token": "hf_optional"
}
```

### `GET /scans/{id}` — response while running

```json
{
  "scan_id": "uuid",
  "target": "meta-llama/Llama-3-8B",
  "status": "running",
  "risk_score": null,
  "modules_status": {
    "serialization": "complete",
    "cve": "running",
    "config": "complete",
    "behavioral": "pending",
    "bias": "pending"
  },
  "findings_count": { "CRITICAL": 1, "HIGH": 0, "MEDIUM": 2, "LOW": 0 }
}
```

---

## Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        bigint github_id
        varchar github_username
        varchar email
        text avatar_url
        timestamptz created_at
    }

    SCANS {
        uuid id PK
        uuid user_id FK
        text target
        varchar target_type
        varchar status
        integer risk_score
        varchar risk_label
        jsonb modules_status
        timestamptz created_at
        timestamptz completed_at
    }

    FINDINGS {
        uuid id PK
        uuid scan_id FK
        varchar module
        varchar severity
        varchar title
        text description
        varchar owasp_tag
        text remediation
        jsonb raw_data
        timestamptz created_at
    }

    USERS ||--o{ SCANS : "has"
    SCANS ||--o{ FINDINGS : "contains"
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **CLI** | Python, Click, Rich, httpx | Terminal interface + pip package |
| **Backend** | FastAPI, SQLAlchemy, asyncpg | REST API, async scan orchestration |
| **Auth** | GitHub OAuth 2.0, python-jose | Authentication + JWT |
| **Database** | PostgreSQL (Neon) | Scan history, findings, users |
| **Frontend** | Vite, React, React Router | Web dashboard |
| **Scan: Serial** | modelscan, huggingface-hub | Malicious code detection in model files |
| **Scan: CVE** | pip-audit | Dependency vulnerability scanning |
| **Scan: Config** | huggingface-hub | Security misconfiguration detection |
| **Scan: Probe** | httpx + HF Inference API | Adversarial prompt testing |
| **Scan: Bias** | httpx + sentiment heuristics | Demographic bias detection |
| **Deployment** | Render (backend), Vercel (frontend) | Cloud hosting |

---

## Project Structure

```
sentinelai/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── config.py               # Settings + env vars
│   │   ├── auth/
│   │   │   ├── router.py           # /auth/* routes
│   │   │   ├── github.py           # GitHub OAuth helpers
│   │   │   └── jwt.py              # Token issue / verify
│   │   ├── users/
│   │   │   ├── router.py           # /users/* routes
│   │   │   └── models.py           # SQLAlchemy User model
│   │   ├── scans/
│   │   │   ├── router.py           # /scans/* routes
│   │   │   ├── models.py           # Scan + Finding models
│   │   │   └── service.py          # Scan orchestrator (background task)
│   │   ├── scanner/
│   │   │   ├── base.py             # BaseScanner + FindingData
│   │   │   ├── serialization.py    # Module 1
│   │   │   ├── cve.py              # Module 2
│   │   │   ├── config_audit.py     # Module 3
│   │   │   ├── behavioral.py       # Module 4
│   │   │   ├── bias.py             # Module 5
│   │   │   ├── scorer.py           # Risk score formula
│   │   │   └── report.py           # HTML + JSON report generator
│   │   └── db/
│   │       └── database.py         # Async SQLAlchemy engine
│   ├── requirements.txt
│   └── Procfile                    # Render deployment
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScanDetail.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   ├── api/
│   │   │   └── api.js              # Axios client + all API calls
│   │   └── App.jsx
│   └── package.json
│
└── cli/
    ├── sentinelai/
    │   ├── main.py                 # Click group entrypoint
    │   ├── auth.py                 # login command
    │   ├── scan.py                 # scan command + polling
    │   ├── api.py                  # HTTP client
    │   └── config.py               # ~/.sentinelai/config.json
    └── pyproject.toml
```

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `backend/.env`

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set `VITE_API_URL` to your Render backend URL in the Vercel dashboard.

### CLI → PyPI

```bash
cd cli
pip install build twine
python -m build
twine upload dist/*

# Users install with:
pip install sentinelai
```

---

## Scan Output Files

Two files are saved to disk after every scan:

**`model-name-report.json`** — machine-readable, CI/CD ready
```json
{
  "scan_id": "uuid",
  "target": "distilbert-base-uncased",
  "risk_score": 42,
  "risk_label": "MEDIUM",
  "findings": [ { "severity": "HIGH", "title": "...", "remediation": "..." } ],
  "summary": { "total_findings": 4, "by_severity": { "HIGH": 1, "MEDIUM": 2 } }
}
```

**`model-name-report.html`** — styled, shareable report with risk gauge, finding cards with severity badges, OWASP tags, and remediation steps. Open in any browser.

---

## Roadmap

- [x] 5 scan modules (Serialization, CVE, Config, Behavioral, Bias)
- [x] CLI with `login` and `scan` commands
- [x] Web dashboard with scan history + report downloads
- [x] GitHub OAuth + JWT auth
- [ ] GitHub Actions integration (`sentinel.yml` workflow)
- [ ] AI Bill of Materials (CycloneDX / SPDX format)
- [ ] `--fail-on-severity=HIGH` flag for CI/CD pipelines
- [ ] Plugin architecture for community scanner modules
- [ ] LLM-as-judge for behavioral probe (more accurate than regex)
- [ ] GDPR / HIPAA / SOC2 compliance scanner modules

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo and clone your fork
git clone https://github.com/TahirSiddique092/sentinel-ai.git

# Create a feature branch
git checkout -b feat/your-feature-name

# Make your changes and push
git push origin feat/your-feature-name

# Open a pull request
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built at Hackathon 2026 · AI Security · Responsible AI · Model Governance

**[Dashboard](https://sentinelai.vercel.app)** · **[API Docs](https://sentinelai-api.onrender.com/docs)** · **[pip install sentinelai](https://pypi.org/project/sentinelai)**

</div>
