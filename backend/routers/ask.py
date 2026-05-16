from fastapi import APIRouter, HTTPException
from models.query_models import AskRequest, AskResponse
from services.schema_retriever import get_relevant_schema
from services.prompt_builder import SYSTEM_PROMPT, build_user_prompt
from services.llm_service import call_llm
from database import db_cursor
import json

router = APIRouter(prefix="/ask", tags=["agent"])


@router.post("", response_model=AskResponse)
async def ask(request: AskRequest):
    schema_context = get_relevant_schema(
        request.question,
        domain_hint=request.domain_hint
    )

    if not schema_context["tables"]:
        raise HTTPException(status_code=400, detail="No schema loaded. Please ingest schema first.")

    user_prompt = build_user_prompt(request.question, schema_context)

    result, usage = await call_llm(SYSTEM_PROMPT, user_prompt)

    with db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO query_history
                (user_question, generated_sql, explanation, tables_used, confidence, model_used, prompt_tokens)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            request.question,
            result.get("sql"),
            result.get("explanation"),
            json.dumps(result.get("tables_used", [])),
            result.get("confidence"),
            "claude-sonnet-4" if "anthropic" in str(usage) else "gpt-4o",
            usage.get("input_tokens", usage.get("prompt_tokens", 0))
        ))

    return AskResponse(**result)
