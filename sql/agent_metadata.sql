-- agent_metadata.sql

CREATE DATABASE CasinoQAAgent;
GO

USE CasinoQAAgent;
GO

-- Stores all known tables from the casino platform schema
CREATE TABLE schema_tables (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    table_name      NVARCHAR(200)   NOT NULL,
    schema_name     NVARCHAR(100)   NOT NULL DEFAULT 'dbo',
    description     NVARCHAR(1000)  NULL,
    domain_category NVARCHAR(100)   NULL,  -- 'wallet','bonus','player','transaction','game'
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT uq_table UNIQUE (schema_name, table_name)
);

-- Stores all columns per table
CREATE TABLE schema_columns (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    table_id        INT             NOT NULL REFERENCES schema_tables(id),
    column_name     NVARCHAR(200)   NOT NULL,
    data_type       NVARCHAR(100)   NOT NULL,
    is_nullable     BIT             NOT NULL DEFAULT 1,
    is_primary_key  BIT             NOT NULL DEFAULT 0,
    is_foreign_key  BIT             NOT NULL DEFAULT 0,
    description     NVARCHAR(1000)  NULL,
    sample_values   NVARCHAR(500)   NULL,   -- e.g. "PENDING, COMPLETED, FAILED"
    created_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- Stores relationships between tables
CREATE TABLE schema_relationships (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    from_table_id       INT             NOT NULL REFERENCES schema_tables(id),
    from_column         NVARCHAR(200)   NOT NULL,
    to_table_id         INT             NOT NULL REFERENCES schema_tables(id),
    to_column           NVARCHAR(200)   NOT NULL,
    relationship_type   NVARCHAR(50)    NOT NULL DEFAULT 'FK', -- FK, LOGICAL
    description         NVARCHAR(500)   NULL,
    created_at          DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- Stores every question asked and the generated SQL
CREATE TABLE query_history (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    user_question   NVARCHAR(MAX)   NOT NULL,
    generated_sql   NVARCHAR(MAX)   NULL,
    explanation     NVARCHAR(MAX)   NULL,
    tables_used     NVARCHAR(500)   NULL,
    confidence      NVARCHAR(50)    NULL,   -- HIGH, MEDIUM, LOW
    model_used      NVARCHAR(100)   NULL,
    prompt_tokens   INT             NULL,
    created_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- Optional: store named validation patterns for reuse
CREATE TABLE qa_validation_patterns (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    pattern_name    NVARCHAR(200)   NOT NULL,
    description     NVARCHAR(1000)  NULL,
    domain_category NVARCHAR(100)   NULL,
    template_sql    NVARCHAR(MAX)   NULL,
    created_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- Indexes
CREATE INDEX ix_schema_tables_domain    ON schema_tables(domain_category);
CREATE INDEX ix_schema_columns_table    ON schema_columns(table_id);
CREATE INDEX ix_query_history_created   ON query_history(created_at DESC);


SELECT
    table_name, 
    column_name
FROM 
    information_schema.columns
WHERE 
    TABLE_CATALOG = 'CMP13.0SP6EP3.2HF4'
ORDER BY 
    table_name, 
    ordinal_position;


select * from information_schema