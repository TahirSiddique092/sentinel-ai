import json, os
from pathlib import Path

CONFIG_DIR = Path.home() / ".sentinelai"
CONFIG_FILE = CONFIG_DIR / "config.json"
DEFAULT_API_URL = "https://sentinelai-api.onrender.com"

def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {"api_url": DEFAULT_API_URL, "token": None}
    with open(CONFIG_FILE) as f:
        return json.load(f)

def save_config(data: dict):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_token() -> str | None:
    return load_config().get("token")

def get_api_url() -> str:
    return load_config().get("api_url", DEFAULT_API_URL)
