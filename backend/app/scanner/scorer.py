from typing import List
from .base import FindingData

SEVERITY_WEIGHTS = {"CRITICAL": 10, "HIGH": 7, "MEDIUM": 4, "LOW": 1, "INFO": 0}
OWASP_MULTIPLIERS = {"LLM01": 1.5, "LLM07": 1.3, "LLM03": 1.2}
MAX_SCORE = 100
NORMALIZATION_BASE = 60  # raw score mapped to 100 at this value

def calculate_score(findings: List[FindingData]) -> tuple[int, str]:
    raw = 0
    for f in findings:
        weight = SEVERITY_WEIGHTS.get(f.severity, 0)
        multiplier = OWASP_MULTIPLIERS.get(f.owasp_tag, 1.0)
        raw += weight * multiplier

    normalized = min(int((raw / NORMALIZATION_BASE) * MAX_SCORE), MAX_SCORE)

    if normalized <= 25: label = "LOW"
    elif normalized <= 50: label = "MEDIUM"
    elif normalized <= 75: label = "HIGH"
    else: label = "CRITICAL"

    return normalized, label