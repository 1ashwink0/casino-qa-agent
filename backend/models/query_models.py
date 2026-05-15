from pydantic import BaseModel
from typing import List, Optional

class AskRequest(BaseModel):
    question: str
    domain_hint: Optional[str] = None  # "wallet", "bonus", "player", etc.

class AskResponse(BaseModel):
    sql: str
    explanation: str
    tables_used: List[str]
    joins_used: List[str]
    validation_notes: str
    assumptions: str
    edge_cases: str
    confidence: str  # HIGH, MEDIUM, LOW