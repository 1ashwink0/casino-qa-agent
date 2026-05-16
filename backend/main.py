from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ask, schema, history
from database import init_db

app = FastAPI(title="Casino QA SQL Intelligence Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask.router)
app.include_router(schema.router)
app.include_router(history.router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health(): return {"status": "ok"}
