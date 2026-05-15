from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_connection_string: str
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_provider: str = "anthropic"  # "anthropic" or "openai"
    llm_model: str = "claude-sonnet-4-20250514"
    max_schema_tables_in_context: int = 8



    class Config:
        env_file = ".env"

settings = Settings()