import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "casino_qa.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS schema_tables (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name      TEXT NOT NULL,
            schema_name     TEXT NOT NULL DEFAULT 'dbo',
            description     TEXT,
            domain_category TEXT,
            is_active       INTEGER NOT NULL DEFAULT 1,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(schema_name, table_name)
        );

        CREATE TABLE IF NOT EXISTS schema_columns (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id        INTEGER NOT NULL REFERENCES schema_tables(id),
            column_name     TEXT NOT NULL,
            data_type       TEXT NOT NULL,
            is_nullable     INTEGER NOT NULL DEFAULT 1,
            is_primary_key  INTEGER NOT NULL DEFAULT 0,
            is_foreign_key  INTEGER NOT NULL DEFAULT 0,
            description     TEXT,
            sample_values   TEXT,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS schema_relationships (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            from_table_id       INTEGER NOT NULL REFERENCES schema_tables(id),
            from_column         TEXT NOT NULL,
            to_table_id         INTEGER NOT NULL REFERENCES schema_tables(id),
            to_column           TEXT NOT NULL,
            relationship_type   TEXT NOT NULL DEFAULT 'FK',
            description         TEXT,
            created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS query_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_question   TEXT NOT NULL,
            generated_sql   TEXT,
            explanation     TEXT,
            tables_used     TEXT,
            confidence      TEXT,
            model_used      TEXT,
            prompt_tokens   INTEGER,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS qa_validation_patterns (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern_name    TEXT NOT NULL,
            description     TEXT,
            domain_category TEXT,
            template_sql    TEXT,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS ix_schema_tables_domain ON schema_tables(domain_category);
        CREATE INDEX IF NOT EXISTS ix_schema_columns_table ON schema_columns(table_id);
        CREATE INDEX IF NOT EXISTS ix_query_history_created ON query_history(created_at DESC);
    """)
    conn.commit()
    conn.close()


@contextmanager
def db_cursor():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
