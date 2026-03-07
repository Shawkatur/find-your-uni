from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str          # server-side; never expose to frontend
    SUPABASE_ANON_KEY: str                  # public key (for client-side JWT verify)
    SUPABASE_JWT_SECRET: str                # from Supabase dashboard → Settings → API

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── Cloudflare R2 (optional — documents feature) ──────────────────────────
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_SECRET: str = "change-me-in-prod"
    # Accept comma-separated string OR JSON array from env
    CORS_ORIGINS: str = "http://localhost:3000"

    # ── Rate limiting ─────────────────────────────────────────────────────────
    MATCH_RATE_LIMIT: str = "10/minute"

    # ── APScheduler ──────────────────────────────────────────────────────────
    SCORECARD_SYNC_CRON: str = "0 2 * * 1"     # every Monday 02:00 UTC
    SCORECARD_API_KEY: str = ""                  # optional (higher rate limit)

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS as comma-separated string or JSON array."""
        val = self.CORS_ORIGINS.strip()
        if val.startswith("["):
            import json
            try:
                return json.loads(val)
            except Exception:
                pass
        return [o.strip() for o in val.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
