"""
Shared fixtures for the Find Your University test suite.

Uses BYPASS_AUTH=true + in-process TestClient so no real Supabase/OpenAI
connections are needed. External calls are mocked at the service boundary.
"""
from __future__ import annotations
import asyncio
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Set env vars before any app imports
os.environ.update({
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
    "SUPABASE_ANON_KEY": "test-anon-key",
    "SUPABASE_JWT_SECRET": "test-jwt-secret-at-least-32-chars-long",
    "OPENAI_API_KEY": "sk-test-key",
    "BYPASS_AUTH": "true",
    "APP_ENV": "development",
    "APP_SECRET": "test-secret",
})


# ── Mock Supabase client ─────────────────────────────────────────────────────

class MockQueryBuilder:
    """Chainable mock that simulates Supabase PostgREST query builder."""

    def __init__(self, data=None, count=None):
        self._data = data or []
        self._count = count

    def select(self, *a, **kw):
        return self

    def insert(self, data):
        self._data = [data] if isinstance(data, dict) else data
        return self

    def update(self, data):
        return self

    def delete(self):
        return self

    def upsert(self, data):
        self._data = [data] if isinstance(data, dict) else data
        return self

    def eq(self, *a):
        return self

    def neq(self, *a):
        return self

    def in_(self, *a):
        return self

    def is_(self, *a):
        return self

    @property
    def not_(self):
        return self

    def ilike(self, *a):
        return self

    def lte(self, *a):
        return self

    def gte(self, *a):
        return self

    def or_(self, *a):
        return self

    def order(self, *a, **kw):
        return self

    def limit(self, *a):
        return self

    def range(self, *a):
        return self

    def single(self):
        return self

    async def execute(self):
        return MagicMock(data=self._data, count=self._count)


class MockSupabaseClient:
    """Minimal mock of supabase.AsyncClient."""

    def __init__(self):
        self._tables: dict[str, list[dict]] = {}
        self.auth = MagicMock()
        self.auth.admin = MagicMock()
        self.auth.admin.update_user_by_id = AsyncMock()
        self.auth.admin.create_user = AsyncMock()
        self.storage = MagicMock()
        self._channel_mock = MagicMock()
        self._channel_mock.subscribe = AsyncMock()
        self._channel_mock.send_broadcast = AsyncMock()

    def table(self, name: str) -> MockQueryBuilder:
        return MockQueryBuilder(data=self._tables.get(name, []))

    def set_table_data(self, name: str, data: list[dict]):
        self._tables[name] = data

    def channel(self, name: str):
        return self._channel_mock

    async def remove_channel(self, ch):
        pass

    def rpc(self, name: str, params: dict = None):
        return MockQueryBuilder()


@pytest.fixture
def mock_client():
    return MockSupabaseClient()


@pytest.fixture
def app(mock_client):
    """Create a FastAPI test app with mocked Supabase and disabled scheduler."""
    from unittest.mock import patch as _patch

    # Disable APScheduler during tests to avoid event loop issues
    with _patch("app.main.scheduler"):
        from app.main import app as fastapi_app
        from app.db.client import get_client

        async def _override():
            return mock_client

        fastapi_app.dependency_overrides[get_client] = _override
        yield fastapi_app
        fastapi_app.dependency_overrides.clear()


@pytest.fixture
def client(app):
    """Synchronous TestClient for the FastAPI app."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ── Sample data fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def sample_student():
    return {
        "id": "student-001",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "full_name": "Test Student",
        "phone": "+8801712345678",
        "academic_history": {"gpa_percentage": 85},
        "test_scores": {"ielts": 7.0},
        "budget_usd_per_year": 30000,
        "preferred_countries": ["US", "CA"],
        "preferred_degree": "master",
        "preferred_fields": ["cs"],
        "push_enabled": True,
        "notify_status_changes": True,
        "notify_deadlines": True,
        "onboarding_completed": True,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_application():
    return {
        "id": "app-001",
        "student_id": "student-001",
        "program_id": "prog-001",
        "consultant_id": None,
        "agency_id": None,
        "status": "lead",
        "status_history": [],
        "notes": None,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_university():
    return {
        "id": "uni-001",
        "name": "Test University",
        "country": "US",
        "city": "Boston",
        "ranking_qs": 50,
        "ranking_the": 60,
        "tuition_usd_per_year": 25000,
        "acceptance_rate_overall": 45.0,
        "acceptance_rate_bd": 55.0,
        "min_ielts": 6.5,
        "min_toefl": 80,
        "min_gpa_percentage": 70,
        "scholarships_available": True,
        "max_scholarship_pct": 50,
        "website": "https://test.edu",
        "data_source": "manual",
        "last_updated": "2025-01-01T00:00:00Z",
    }


@pytest.fixture
def sample_program():
    return {
        "id": "prog-001",
        "university_id": "uni-001",
        "name": "MSc Computer Science",
        "degree_level": "master",
        "field": "cs",
        "tuition_usd_per_year": 25000,
        "duration_years": 2.0,
        "min_requirements": {"ielts": 6.5, "gpa_pct": 70},
        "application_deadline": "2026-12-01",
        "intake_months": [1, 9],
        "is_active": True,
    }
