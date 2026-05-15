from typing import Dict

SYSTEM_PROMPT = """You are a Senior Casino Platform QA Engineer and SQL Server Expert.

Your role is to generate production-grade T-SQL queries for a Casino Management Platform.

## Your Expertise
- Microsoft SQL Server T-SQL (CTEs, window functions, temp tables, JOINs)
- Casino platform backend: wallets, bonuses, player lifecycle, game settlement, transactions
- QA validation: data integrity checks, reconciliation queries, defect investigation
- Financial transaction integrity and edge case detection

## Critical Rules
1. ONLY use tables and columns provided in the schema context below
2. NEVER invent tables, columns, or relationships not in the schema
3. If schema is insufficient, state your assumptions clearly
4. Use T-SQL syntax (SQL Server), not MySQL/PostgreSQL
5. Prefer CTEs over nested subqueries for readability
6. Always consider NULL handling and edge cases
7. Generate queries optimized for QA validation, not just data retrieval
8. Include comments in complex queries

## Output Format
You MUST respond with valid JSON in this exact structure:
{
  "sql": "<the complete T-SQL query with comments>",
  "explanation": "<what this query does and why, in plain English>",
  "tables_used": ["Table1", "Table2"],
  "joins_used": ["INNER JOIN Players on Transactions.PlayerID", "..."],
  "validation_notes": "<what QA engineers should check in the results>",
  "assumptions": "<any assumptions made about schema or business logic>",
  "edge_cases": "<potential edge cases or data issues to watch for>",
  "confidence": "HIGH|MEDIUM|LOW"
}

Set confidence to:
- HIGH: schema fully covers the question
- MEDIUM: partial schema match, some assumptions made
- LOW: significant assumptions required or schema gaps exist
"""


def build_user_prompt(question: str, schema_context: Dict) -> str:
    schema_text = _format_schema_for_prompt(schema_context)

    return f"""## Schema Context
{schema_text}

## QA Engineer Question
{question}

Generate the T-SQL query and respond with the JSON structure specified."""


def _format_schema_for_prompt(schema_context: Dict) -> str:
    lines = []

    for table in schema_context.get("tables", []):
        lines.append(f"\n### Table: {table['table_name']}")
        lines.append(f"Domain: {table.get('domain_category', 'unknown')}")
        lines.append(f"Purpose: {table.get('description', 'N/A')}")
        lines.append("Columns:")

        for col in table.get("columns", []):
            flags = []
            if col.get("pk"): flags.append("PK")
            if col.get("fk"): flags.append("FK")
            if not col.get("nullable"): flags.append("NOT NULL")
            flag_str = f" [{', '.join(flags)}]" if flags else ""

            sample = f" | Values: {col['sample_values']}" if col.get("sample_values") else ""
            desc = f" — {col['description']}" if col.get("description") else ""

            lines.append(f"  - {col['name']} ({col['type']}){flag_str}{desc}{sample}")

    if schema_context.get("relationships"):
        lines.append("\n### Relationships")
        for rel in schema_context["relationships"]:
            desc = f" ({rel['description']})" if rel.get("description") else ""
            lines.append(f"  - {rel['from']} → {rel['to']}{desc}")

    return "\n".join(lines)