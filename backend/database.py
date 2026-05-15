import pyodbc
from contextlib import contextmanager
from config import settings

def get_connection():
    return pyodbc.connect(settings.db_connection_string)

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