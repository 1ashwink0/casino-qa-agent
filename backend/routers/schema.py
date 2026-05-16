from fastapi import APIRouter, HTTPException
from models.schema_models import SchemaIngestRequest
from database import db_cursor

router = APIRouter(prefix="/schema", tags=["schema"])

@router.post("/ingest")
def ingest_schema(request: SchemaIngestRequest):
    with db_cursor() as cursor:
        for table in request.tables:
            cursor.execute(
                "SELECT id FROM schema_tables WHERE table_name = ? AND schema_name = ?",
                (table.table_name, table.schema_name)
            )
            existing = cursor.fetchone()
            if existing:
                table_id = existing[0]
                cursor.execute("""
                    UPDATE schema_tables
                    SET description = ?, domain_category = ?, updated_at = datetime('now')
                    WHERE id = ?
                """, (table.description, table.domain_category, table_id))
            else:
                cursor.execute("""
                    INSERT INTO schema_tables (table_name, schema_name, description, domain_category)
                    VALUES (?, ?, ?, ?)
                """, (table.table_name, table.schema_name, table.description, table.domain_category))
                table_id = cursor.lastrowid

            cursor.execute("DELETE FROM schema_columns WHERE table_id = ?", (table_id,))
            for col in table.columns:
                cursor.execute("""
                    INSERT INTO schema_columns
                        (table_id, column_name, data_type, is_nullable, is_primary_key,
                         is_foreign_key, description, sample_values)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (table_id, col.column_name, col.data_type,
                      col.is_nullable, col.is_primary_key,
                      col.is_foreign_key, col.description, col.sample_values))

        for rel in request.relationships:
            cursor.execute("SELECT id FROM schema_tables WHERE table_name = ?", (rel.from_table,))
            from_row = cursor.fetchone()
            cursor.execute("SELECT id FROM schema_tables WHERE table_name = ?", (rel.to_table,))
            to_row = cursor.fetchone()
            if from_row and to_row:
                cursor.execute("""
                    INSERT INTO schema_relationships
                        (from_table_id, from_column, to_table_id, to_column, description)
                    VALUES (?, ?, ?, ?, ?)
                """, (from_row[0], rel.from_column, to_row[0], rel.to_column, rel.description))

    return {"status": "ok", "tables_ingested": len(request.tables)}


@router.get("/tables")
def list_tables():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT t.table_name, t.schema_name, t.description, t.domain_category,
                   COUNT(c.id) AS column_count
            FROM schema_tables t
            LEFT JOIN schema_columns c ON c.table_id = t.id
            WHERE t.is_active = 1
            GROUP BY t.table_name, t.schema_name, t.description, t.domain_category
            ORDER BY t.domain_category, t.table_name
        """)
        rows = cursor.fetchall()
        return [
            {
                "table_name": r[0], "schema_name": r[1],
                "description": r[2], "domain_category": r[3],
                "column_count": r[4]
            }
            for r in rows
        ]
