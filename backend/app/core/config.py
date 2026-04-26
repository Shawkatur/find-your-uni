from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
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

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_SECRET: str = "change-me-in-prod"
    BYPASS_AUTH: bool = False       # set to true to skip JWT checks during testing
    ADMIN_SECRET: str = ""          # if set, all /admin/* routes require X-Admin-Secret header

    @field_validator("APP_SECRET")
    @classmethod
    def _check_app_secret(cls, v: str, info) -> str:
        env = info.data.get("APP_ENV", "development")
        if env == "production" and v in ("change-me-in-prod", ""):
            raise ValueError("APP_SECRET must be set to a strong value in production")
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _check_cors_origins(cls, v: str, info) -> str:
        env = info.data.get("APP_ENV", "development")
        if env == "production" and v.strip() == "*":
            raise ValueError("CORS_ORIGINS must not be '*' in production")
        return v
    ADMIN_FRONTEND_URL: str = ""   # e.g. https://admin.ourdomain.com (auto-added to CORS)
    STUDENT_FRONTEND_URL: str = "" # e.g. https://app.ourdomain.com (auto-added to CORS)
    # Accept comma-separated string OR JSON array from env
    # Default * allows all origins during testing
    CORS_ORIGINS: str = "*"
    # Optional regex (e.g. r"https://.*\.vercel\.app") matched against Origin
    # by FastAPI's CORSMiddleware in addition to CORS_ORIGINS exact matches.
    CORS_ORIGIN_REGEX: str = ""

    # ── SSLCommerz (payment gateway) ─────────────────────────────────────────
    SSLCOMMERZ_STORE_ID: str = ""
    SSLCOMMERZ_STORE_PASS: str = ""
    SSLCOMMERZ_API_URL: str = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    SSLCOMMERZ_VALIDATION_URL: str = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
    APP_BASE_URL: str = "http://localhost:8000"

    # ── Rate limiting ─────────────────────────────────────────────────────────
    MATCH_RATE_LIMIT: str = "10/minute"

    # ── Match cache ────────────────────────────────────────────────────────
    MATCH_CACHE_TTL_HOURS: int = 24        # cached results expire after this many hours

    # ── APScheduler ──────────────────────────────────────────────────────────
    SCORECARD_SYNC_CRON: str = "0 2 * * 1"     # every Monday 02:00 UTC
    SCORECARD_API_KEY: str = ""                  # optional (higher rate limit)

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS as comma-separated string or JSON array.
        Auto-includes ADMIN_FRONTEND_URL if set."""
        val = self.CORS_ORIGINS.strip()
        if val.startswith("["):
            import json
            try:
                origins = json.loads(val)
            except Exception:
                origins = [o.strip() for o in val.split(",") if o.strip()]
        else:
            origins = [o.strip() for o in val.split(",") if o.strip()]
        if self.ADMIN_FRONTEND_URL and self.ADMIN_FRONTEND_URL not in origins:
            origins.append(self.ADMIN_FRONTEND_URL)
        if self.STUDENT_FRONTEND_URL and self.STUDENT_FRONTEND_URL not in origins:
            origins.append(self.STUDENT_FRONTEND_URL)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
