# Casino QA SQL Intelligence Agent

An LLM-powered T-SQL generation engine for casino platform QA. Ask data integrity and validation questions in plain English, get production-grade T-SQL queries with explanations, join details, and edge-case analysis.

## Architecture

```
┌──────────────┐      ┌─────────────────────────────────────┐      ┌──────────────┐
│              │ HTTP  │          FastAPI Backend            │      │              │
│   React SPA  │──────▶│  ┌─────────┐  ┌──────────────────┐ │      │   SQL Server  │
│  (frontend/) │       │  │ Router  │─▶│ Schema Retriever │─│──────▶│  (Casino DB)  │
│              │◀──────│  │ (ask/   │  └──────────────────┘ │      │              │
└──────────────┘      │  │  schema/ │  ┌──────────────────┐ │      └──────────────┘
                      │  │  history)│──│  LLM Service     │ │
                      │  └─────────┘  │  (Anthropic/OpenAI)│ │
                      │               └──────────────────┘ │
                      └─────────────────────────────────────┘
                                      │
                               ┌──────┴──────┐
                               │   n8n       │
                               │   Workflow   │
                               └─────────────┘
```

## Features

- **Natural Language → T-SQL** — Ask QA questions like *"Find failed bonus payouts in the last 24 hours"* and get a ready-to-run query
- **Schema-Aware** — Only queries against tables and columns you've ingested. No hallucinated tables.
- **Domain Categorization** — Organize tables by casino domain: `wallet`, `bonus`, `player`, `transaction`, `game`
- **Keyword Schema Retrieval** — Automatically selects the most relevant tables for your question using domain keyword matching
- **Multi-Provider LLM** — Supports Anthropic (Claude) and OpenAI (GPT-4o) — configurable at runtime
- **Confidence Scoring** — Each query comes with a HIGH / MEDIUM / LOW confidence rating based on schema coverage
- **Query History** — All generated queries are logged with tokens used for auditing
- **Structured Output** — Every response includes: SQL, explanation, joins used, validation notes, assumptions, and edge cases
- **n8n Integration** — Optional n8n workflow for automated schema sync from your casino platform database

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Frontend** | React 18, Vite |
| **Database** | SQL Server (via ODBC) |
| **LLM Providers** | Anthropic Claude / OpenAI GPT-4o |
| **HTTP Client** | HTTPX (async) |
| **Validation** | Pydantic v2, pydantic-settings |
| **Automation** | n8n (optional, for schema sync) |
| **Schema Storage** | SQL Server metadata tables (`schema_tables`, `schema_columns`, `schema_relationships`) |

## Getting Started

### Prerequisites

- Python 3.11+
- SQL Server instance (local or remote)
- ODBC Driver 17+ for SQL Server
- Node.js 18+ (for frontend)
- Anthropic or OpenAI API key

### 1. Database Setup

Run `sql/agent_metadata.sql` on your SQL Server to create the `CasinoQAAgent` database with all required metadata tables:

```bash
sqlcmd -S YOUR_SERVER -U sa -P YOUR_PASS -i sql/agent_metadata.sql
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

Create `.env` in `backend/`:

```env
DB_CONNECTION_STRING=Driver={ODBC Driver 17 for SQL Server};Server=YOUR_SERVER;Database=CasinoQAAgent;UID=sa;PWD=YOUR_PASS;
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-20250514
MAX_SCHEMA_TABLES_IN_CONTEXT=8
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### 4. Load Schema Metadata

POST the casino schema metadata to the backend:

```bash
curl -X POST http://localhost:8000/schema/ingest \
  -H "Content-Type: application/json" \
  -d @schema_metadata/casino_schema.json
```

Verify with:

```bash
curl http://localhost:8000/schema/tables
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ask` | Ask a QA question, get generated T-SQL |
| `POST` | `/schema/ingest` | Ingest schema metadata (tables, columns, relationships) |
| `GET`  | `/schema/tables` | List all ingested tables |
| `GET`  | `/history` | View past queries and generated SQL |
| `GET`  | `/health` | Health check |

### `/ask` Request Example

```json
{
  "question": "Find players with failed withdrawal reversals",
  "domain_hint": "transaction"
}
```

### `/ask` Response Example

```json
{
  "sql": "SELECT p.PlayerID, p.Username, ...",
  "explanation": "This query joins the Players table with...",
  "tables_used": ["Players", "Transactions"],
  "joins_used": ["INNER JOIN Transactions ON Players.PlayerID = Transactions.PlayerID"],
  "validation_notes": "Check that TransactionType = 'WithdrawalReversal'...",
  "assumptions": "Assumes reversal failures are recorded with Status = 'Failed'",
  "edge_cases": "NULL balance, multiple reversals for same withdrawal",
  "confidence": "HIGH"
}
```

## Project Structure

```
casino-qa-agent/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment-based configuration
│   ├── database.py                # SQL Server connection (pyodbc)
│   ├── requirements.txt           # Python dependencies
│   ├── routers/
│   │   ├── ask.py                 # POST /ask — main query generation endpoint
│   │   ├── schema.py              # Schema ingest & list endpoints
│   │   └── history.py             # GET /history — past query log
│   ├── services/
│   │   ├── llm_service.py         # Anthropic & OpenAI API clients
│   │   ├── prompt_builder.py      # System prompt + schema formatting
│   │   └── schema_retriever.py    # Keyword-based table selection
│   └── models/
│       ├── query_models.py        # Pydantic models for request/response
│       └── schema_models.py       # Pydantic models for schema ingestion
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main React component
│   │   ├── api/agent.js           # API client functions
│   │   └── components/            # UI components
│   └── package.json
├── sql/
│   └── agent_metadata.sql         # Database schema DDL
├── schema_metadata/
│   └── casino_schema.json         # Sample casino schema metadata
├── n8n/
│   └── workflows/
│       └── schema_sync.json       # n8n schema sync workflow
└── README.md
```

## Configuration

All configuration is through environment variables in `backend/.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_CONNECTION_STRING` | Yes | — | ODBC connection string to SQL Server |
| `ANTHROPIC_API_KEY` | No | `""` | Anthropic API key (required for Claude) |
| `OPENAI_API_KEY` | No | `""` | OpenAI API key (required for GPT-4o) |
| `LLM_PROVIDER` | No | `anthropic` | `anthropic` or `openai` |
| `LLM_MODEL` | No | `claude-sonnet-4-20250514` | Model name |
| `MAX_SCHEMA_TABLES_IN_CONTEXT` | No | `8` | Max tables in LLM context |

## Schema Ingestion Format

The schema metadata JSON follows this structure:

```json
{
  "tables": [
    {
      "table_name": "Players",
      "schema_name": "dbo",
      "description": "Master player account table",
      "domain_category": "player",
      "columns": [
        {
          "column_name": "PlayerID",
          "data_type": "INT",
          "is_nullable": false,
          "is_primary_key": true,
          "is_foreign_key": false,
          "description": "Unique player identifier",
          "sample_values": "1001, 1002, 1003"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from_table": "Players",
      "from_column": "PlayerID",
      "to_table": "Wallet",
      "to_column": "PlayerID",
      "description": "Each player has one wallet"
    }
  ]
}
```
