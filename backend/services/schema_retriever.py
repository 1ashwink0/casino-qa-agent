from database import db_cursor
from typing import List, Dict


def get_relevant_schema(question: str, domain_hint: str = None, max_tables: int = 8) -> Dict:
    """
    MVP approach: keyword matching against table/column descriptions.
    Future: replace with vector similarity search.
    """
    keywords = _extract_keywords(question, domain_hint)

    with db_cursor() as cursor:
        # Build keyword filter
        keyword_conditions = " OR ".join([
            f"(LOWER(t.table_name) LIKE '%{kw}%' OR LOWER(t.description) LIKE '%{kw}%' OR LOWER(t.domain_category) LIKE '%{kw}%')"
            for kw in keywords
        ])

        if not keyword_conditions:
            keyword_conditions = "1=1"

        query = f"""
            SELECT TOP {max_tables}
                t.id, t.table_name, t.schema_name, t.description, t.domain_category
            FROM schema_tables t
            WHERE t.is_active = 1
              AND ({keyword_conditions})
            ORDER BY t.domain_category
        """
        cursor.execute(query)
        tables = cursor.fetchall()

        if not tables:
            # Fallback: return all tables (limited)
            cursor.execute(f"""
                SELECT TOP {max_tables} id, table_name, schema_name, description, domain_category
                FROM schema_tables WHERE is_active = 1
            """)
            tables = cursor.fetchall()

        result = {"tables": [], "relationships": []}
        table_ids = []

        for t in tables:
            table_id, table_name, schema_name, description, domain_category = t
            table_ids.append(table_id)

            # Get columns
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, is_primary_key,
                       is_foreign_key, description, sample_values
                FROM schema_columns
                WHERE table_id = ?
                ORDER BY is_primary_key DESC, is_foreign_key DESC, column_name
            """, table_id)
            columns = cursor.fetchall()

            result["tables"].append({
                "table_name": f"{schema_name}.{table_name}",
                "description": description,
                "domain_category": domain_category,
                "columns": [
                    {
                        "name": c[0],
                        "type": c[1],
                        "nullable": bool(c[2]),
                        "pk": bool(c[3]),
                        "fk": bool(c[4]),
                        "description": c[5],
                        "sample_values": c[6]
                    }
                    for c in columns
                ]
            })

        # Get relationships between found tables
        if table_ids:
            placeholders = ",".join(["?" for _ in table_ids])
            cursor.execute(f"""
                SELECT 
                    ft.table_name, r.from_column,
                    tt.table_name, r.to_column, r.description
                FROM schema_relationships r
                JOIN schema_tables ft ON r.from_table_id = ft.id
                JOIN schema_tables tt ON r.to_table_id = tt.id
                WHERE r.from_table_id IN ({placeholders})
                   OR r.to_table_id IN ({placeholders})
            """, *table_ids, *table_ids)
            rels = cursor.fetchall()
            result["relationships"] = [
                {
                    "from": f"{r[0]}.{r[1]}",
                    "to": f"{r[2]}.{r[3]}",
                    "description": r[4]
                }
                for r in rels
            ]

        return result


def _extract_keywords(question: str, domain_hint: str = None) -> List[str]:
    """Extract domain-relevant keywords from the question."""

    # Domain keyword map
    domain_map = {
        "wallet": ["wallet", "balance", "fund", "credit", "debit"],
        "bonus": ["bonus", "wagering", "wager", "promotion", "promo"],
        "player": ["player", "user", "account", "kyc", "registration"],
        "transaction": ["transaction", "deposit", "withdrawal", "payment", "payout"],
        "game": ["game", "round", "bet", "spin", "jackpot", "settlement"],
    }

    question_lower = question.lower()
    keywords = set()

    if domain_hint and domain_hint.lower() in domain_map:
        keywords.update(domain_map[domain_hint.lower()])

    for domain, words in domain_map.items():
        for word in words:
            if word in question_lower:
                keywords.add(word)
                keywords.add(domain)

    # Always include some core terms from the question
    for word in question_lower.split():
        if len(word) > 4:
            keywords.add(word.strip("?.,!"))

    return list(keywords)