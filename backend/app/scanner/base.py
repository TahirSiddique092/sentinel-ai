from dataclasses import dataclass, field
from typing import List
from abc import ABC, abstractmethod

@dataclass
class FindingData:
    module: str
    severity: str        # CRITICAL | HIGH | MEDIUM | LOW | INFO
    title: str
    description: str
    owasp_tag: str = ""
    remediation: str = ""
    raw_data: dict = field(default_factory=dict)

class BaseScanner(ABC):
    def __init__(self, target: str, target_type: str, hf_token: str = None):
        self.target = target
        self.target_type = target_type
        self.hf_token = hf_token

    @abstractmethod
    async def run(self) -> List[FindingData]:
        """Run the scan and return a list of findings."""
        ...