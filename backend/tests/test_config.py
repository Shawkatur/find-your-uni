"""
Unit tests for configuration and settings validation.
"""
import os
import pytest
from unittest.mock import patch
from pydantic import ValidationError


class TestSettings:
    def test_cors_origins_list_from_string(self):
        from app.core.config import Settings
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="key",
            SUPABASE_ANON_KEY="anon",
            SUPABASE_JWT_SECRET="secret",
            OPENAI_API_KEY="sk-test",
            CORS_ORIGINS="http://localhost:3000,http://localhost:8000",
        )
        origins = s.cors_origins_list
        assert "http://localhost:3000" in origins
        assert "http://localhost:8000" in origins

    def test_cors_origins_list_wildcard(self):
        from app.core.config import Settings
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="key",
            SUPABASE_ANON_KEY="anon",
            SUPABASE_JWT_SECRET="secret",
            OPENAI_API_KEY="sk-test",
            CORS_ORIGINS="*",
        )
        assert "*" in s.cors_origins_list

    def test_cors_origins_list_json_array(self):
        from app.core.config import Settings
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="key",
            SUPABASE_ANON_KEY="anon",
            SUPABASE_JWT_SECRET="secret",
            OPENAI_API_KEY="sk-test",
            CORS_ORIGINS='["http://a.com","http://b.com"]',
        )
        origins = s.cors_origins_list
        assert "http://a.com" in origins
        assert "http://b.com" in origins

    def test_admin_frontend_url_auto_added(self):
        from app.core.config import Settings
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="key",
            SUPABASE_ANON_KEY="anon",
            SUPABASE_JWT_SECRET="secret",
            OPENAI_API_KEY="sk-test",
            CORS_ORIGINS="http://localhost:3000",
            ADMIN_FRONTEND_URL="http://admin.example.com",
        )
        assert "http://admin.example.com" in s.cors_origins_list

    def test_app_secret_validation_in_production(self):
        with pytest.raises(ValidationError, match="APP_SECRET"):
            from app.core.config import Settings
            Settings(
                SUPABASE_URL="https://test.supabase.co",
                SUPABASE_SERVICE_ROLE_KEY="key",
                SUPABASE_ANON_KEY="anon",
                SUPABASE_JWT_SECRET="secret",
                OPENAI_API_KEY="sk-test",
                APP_ENV="production",
                APP_SECRET="change-me-in-prod",
                CORS_ORIGINS="http://example.com",
            )

    def test_cors_wildcard_rejected_in_production(self):
        with pytest.raises(ValidationError, match="CORS_ORIGINS"):
            from app.core.config import Settings
            Settings(
                SUPABASE_URL="https://test.supabase.co",
                SUPABASE_SERVICE_ROLE_KEY="key",
                SUPABASE_ANON_KEY="anon",
                SUPABASE_JWT_SECRET="secret",
                OPENAI_API_KEY="sk-test",
                APP_ENV="production",
                APP_SECRET="strong-production-secret-here",
                CORS_ORIGINS="*",
            )

    def test_default_values(self):
        from app.core.config import Settings
        s = Settings(
            SUPABASE_URL="https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="key",
            SUPABASE_ANON_KEY="anon",
            SUPABASE_JWT_SECRET="secret",
            OPENAI_API_KEY="sk-test",
        )
        assert s.APP_ENV == "development"
        # BYPASS_AUTH picks up env var from conftest; verify other defaults
        assert s.MATCH_RATE_LIMIT == "10/minute"
        assert s.MATCH_CACHE_TTL_HOURS == 24
        assert s.SCORECARD_SYNC_CRON == "0 2 * * 1"
