from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"
    default_provider: str = "ollama"
    database_url: str = "sqlite+aiosqlite:///./meetings.db"
    max_file_size_mb: int = 50
    cors_origins: str = "http://localhost:5173"
    # Clerk instance issuer, e.g. https://your-slug.clerk.accounts.dev
    clerk_issuer: str | None = None
    # Explicit opt-in to run WITHOUT auth (single-user local dev / tests).
    # Without this, startup fails if CLERK_ISSUER is unset — never silently open.
    allow_insecure_no_auth: bool = False
    # True for local dev; set ENABLE_OLLAMA=false in prod so users must bring
    # their own OpenAI/Anthropic key (no server compute exposure)
    enable_ollama: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def db_path(self) -> str:
        # Extract the file path from the sqlite URL (strip the driver prefix)
        url = self.database_url
        if url.startswith("sqlite"):
            path = url.split("///", 1)[-1]
            return path.removeprefix("./")
        return "meetings.db"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
