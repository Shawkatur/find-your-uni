"""
Unit tests for authentication, authorization, and security utilities.
"""
import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.core.security import (
    get_current_user,
    require_role,
    require_super_admin,
    get_ghost_context,
    require_admin_secret,
    TEST_USER,
    GhostContext,
)


class TestGetCurrentUser:
    def test_bypass_auth_returns_test_user(self):
        user = get_current_user(credentials=None)
        assert user["sub"] == TEST_USER["sub"]
        assert user["email"] == "guest@test.com"

    def test_bypass_auth_no_credentials_needed(self):
        user = get_current_user(credentials=None)
        assert user is not None

    @patch.dict(os.environ, {"APP_ENV": "production"})
    def test_bypass_auth_blocked_in_production(self):
        """In production with BYPASS_AUTH, should fall through to real auth."""
        from app.core.config import get_settings
        get_settings.cache_clear()

        try:
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(credentials=None)
            assert exc_info.value.status_code == 401
        finally:
            os.environ["APP_ENV"] = "development"
            get_settings.cache_clear()


class TestRequireRole:
    def test_admin_role_allows_super_admin(self):
        checker = require_role("admin")
        user = {
            "sub": "user-1",
            "app_metadata": {"role": "super_admin"},
        }
        result = checker(user)
        assert result == user

    def test_admin_role_allows_admin(self):
        checker = require_role("admin")
        user = {"sub": "user-1", "app_metadata": {"role": "admin"}}
        result = checker(user)
        assert result == user

    def test_student_role_rejects_consultant(self):
        """In non-bypass mode, wrong role should be rejected."""
        with patch.dict(os.environ, {"BYPASS_AUTH": "false"}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                checker = require_role("admin")
                user = {"sub": "user-1", "app_metadata": {"role": "student"}}
                with pytest.raises(HTTPException) as exc_info:
                    checker(user)
                assert exc_info.value.status_code == 403
            finally:
                os.environ["BYPASS_AUTH"] = "true"
                get_settings.cache_clear()

    def test_bypass_mode_skips_role_check(self):
        checker = require_role("admin")
        user = {"sub": "user-1", "app_metadata": {"role": "student"}}
        result = checker(user)
        assert result == user


class TestRequireSuperAdmin:
    def test_bypass_mode_allows_any_role(self):
        checker = require_super_admin()
        user = {"sub": "user-1", "app_metadata": {"role": "student"}}
        result = checker(user)
        assert result == user

    def test_rejects_admin_in_strict_mode(self):
        with patch.dict(os.environ, {"BYPASS_AUTH": "false"}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                checker = require_super_admin()
                user = {"sub": "user-1", "app_metadata": {"role": "admin"}}
                with pytest.raises(HTTPException) as exc_info:
                    checker(user)
                assert exc_info.value.status_code == 403
            finally:
                os.environ["BYPASS_AUTH"] = "true"
                get_settings.cache_clear()


class TestRequireAdminSecret:
    @pytest.mark.asyncio
    async def test_no_secret_configured_passes(self):
        request = MagicMock()
        request.headers = {}
        with patch.dict(os.environ, {"ADMIN_SECRET": ""}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                await require_admin_secret(request)
            finally:
                get_settings.cache_clear()

    @pytest.mark.asyncio
    async def test_correct_secret_passes(self):
        request = MagicMock()
        request.headers = {"X-Admin-Secret": "my-secret"}
        with patch.dict(os.environ, {"ADMIN_SECRET": "my-secret"}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                await require_admin_secret(request)
            finally:
                os.environ["ADMIN_SECRET"] = ""
                get_settings.cache_clear()

    @pytest.mark.asyncio
    async def test_wrong_secret_rejects(self):
        request = MagicMock()
        request.headers = {"X-Admin-Secret": "wrong"}
        with patch.dict(os.environ, {"ADMIN_SECRET": "correct"}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                with pytest.raises(HTTPException) as exc_info:
                    await require_admin_secret(request)
                assert exc_info.value.status_code == 403
            finally:
                os.environ["ADMIN_SECRET"] = ""
                get_settings.cache_clear()

    @pytest.mark.asyncio
    async def test_timing_safe_comparison(self):
        """Verify hmac.compare_digest is used (timing-safe)."""
        request = MagicMock()
        request.headers = {"X-Admin-Secret": "a"}
        with patch.dict(os.environ, {"ADMIN_SECRET": "b"}):
            from app.core.config import get_settings
            get_settings.cache_clear()
            try:
                with pytest.raises(HTTPException):
                    await require_admin_secret(request)
            finally:
                os.environ["ADMIN_SECRET"] = ""
                get_settings.cache_clear()


class TestGhostContext:
    def test_ghost_context_dataclass(self):
        ctx = GhostContext(is_ghost=True, admin_user_id="admin-1", source_label="algorithm")
        assert ctx.is_ghost is True
        assert ctx.admin_user_id == "admin-1"
        assert ctx.source_label == "algorithm"
