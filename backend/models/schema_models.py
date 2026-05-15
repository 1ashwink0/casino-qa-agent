from pydantic import BaseModel
from typing import List, Optional

class ColumnDef(BaseModel):
    column_name: str
    data_type: str
    is_nullable: bool = True
    is_primary_key: bool = False
    is_foreign_key: bool = False
    description: Optional[str] = None
    sample_values: Optional[str] = None

class RelationshipDef(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    description: Optional[str] = None

class TableDef(BaseModel):
    table_name: str
    schema_name: str = "dbo"
    description: Optional[str] = None
    domain_category: Optional[str] = None
    columns: List[ColumnDef] = []

class SchemaIngestRequest(BaseModel):
    tables: List[TableDef]
    relationships: List[RelationshipDef] = []