from fastapi import APIRouter
from database import db_cursor

router = APIRouter(prefix="/history", tags=["history"])

@router.get("")
def get_history(limit: int = 20):
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT TOP (?)
                id, user_question, generated_sql, explanation,
                tables_used, confidence, model_used, created_at
            FROM query_history
            ORDER BY created_at DESC
        """, limit)
        rows = cursor.fetchall()
        return [
            {
                "id": r[0], "question": r[1], "sql": r[2],
                "explanation": r[3], "tables_used": r[4],
                "confidence": r[5], "model": r[6],
                "created_at": str(r[7])
            }
            for r in rows
        ]