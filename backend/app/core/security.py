"""
JWT verification via Supabase-issued tokens.
Set BYPASS_AUTH=true in env to skip verification during testing.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Annotated, Optional
import hmac
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AsyncClient

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)

# Test user returned when BYPASS_AUTH=true
TEST_USER = {
    "sub": "00000000-0000-0000-0000-000000000001",
    "email": "guest@test.com",
    "app_metadata": {"role": "student"},
    "user_metadata": {"full_name": "Guest User"},
    "role": "authenticated",
}


def verify_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Returns the payload dict."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
) -> dict:
    """FastAPI dependency — returns the JWT payload for the authenticated user.
    When BYPASS_AUTH=true, returns a test user without checking any token."""
    settings = get_settings()
    if settings.BYPASS_AUTH:
        return TEST_USER
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return verify_token(credentials.credentials)


def require_role(role: str):
    """
    Dependency factory: require the JWT to carry a specific app_metadata.role.
    super_admin implicitly satisfies any 'admin' role requirement.
    When BYPASS_AUTH=true, always passes.
    """
    def _check(user: Annotated[dict, Depends(get_current_user)]) -> dict:
        settings = get_settings()
        if settings.BYPASS_AUTH:
            return user
        user_role = (user.get("app_metadata") or {}).get("role", "student")
        allowed = {role}
        if role == "admin":
            allowed.add("super_admin")
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{role}', got '{user_role}'",
            )
        return user
    return _check


def require_super_admin():
    """Dependency factory: only super_admin role is allowed."""
    def _check(user: Annotated[dict, Depends(get_current_user)]) -> dict:
        settings = get_settings()
        if settings.BYPASS_AUTH:
            return user
        user_role = (user.get("app_metadata") or {}).get("role", "student")
        if user_role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin access required",
            )
        return user
    return _check


# ─── Ghost Mode Context ──────────────────────────────────────────────────────

@dataclass
class GhostContext:
    """Captures ghost-mode state from request headers."""
    is_ghost: bool
    admin_user_id: str
    source_label: str


def get_ghost_context(
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
) -> GhostContext:
    """
    FastAPI dependency that reads X-Ghost-Mode and X-Source-Label headers.
    Ghost mode is only available to super_admin users.
    """
    settings = get_settings()
    is_ghost = request.headers.get("X-Ghost-Mode", "").lower() == "true"
    user_role = (user.get("app_metadata") or {}).get("role", "student")

    if is_ghost and user_role != "super_admin" and not settings.BYPASS_AUTH:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ghost mode requires super_admin role",
        )

    source_label = request.headers.get("X-Source-Label", "system") if is_ghost else "admin"
    admin_id = user["sub"] if not settings.BYPASS_AUTH else "00000000-0000-0000-0000-000000000001"

    return GhostContext(
        is_ghost=is_ghost,
        admin_user_id=admin_id,
        source_label=source_label,
    )


async def require_admin_secret(request: Request) -> None:
    """
    Extra guard for /admin/* routes.
    If ADMIN_SECRET is configured, the request must include the
    X-Admin-Secret header with a matching value, even if the JWT is valid.
    """
    settings = get_settings()
    secret = settings.ADMIN_SECRET
    provided = request.headers.get("X-Admin-Secret", "")
    if secret and not hmac.compare_digest(provided, secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def get_current_student_dep():
    """
    Returns a FastAPI dependency that fetches the student profile for the current user.
    Raises 404 if student profile not found.
    """
    from app.db.client import get_client

    async def _dep(
        user: Annotated[dict, Depends(get_current_user)],
        client: AsyncClient = Depends(get_client),
    ) -> dict:
        from app.db.queries import get_student_by_user_id
        student = await get_student_by_user_id(client, user["sub"])
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
        return student

    return _dep


async def get_consultant_profile(
    user: Annotated[dict, Depends(get_current_user)],
    client: "AsyncClient" = None,
) -> dict:
    """
    Dependency that resolves the consultant row for the current user
    and enforces status='active'.
    Import get_client separately and use both as Depends in route signatures.
    Use _get_consultant_profile_factory below for proper DI.
    """
    raise NotImplementedError("Use get_active_consultant_dep instead")


def get_active_consultant_dep():
    """
    Returns a FastAPI dependency that fetches the consultant profile
    and rejects requests from non-active consultants.
    """
    from app.db.client import get_client  # late import to avoid circular deps

    async def _dep(
        user: Annotated[dict, Depends(get_current_user)],
        client: AsyncClient = Depends(get_client),
    ) -> dict:
        settings = get_settings()
        if settings.BYPASS_AUTH:
            return {
                "id": "00000000-0000-0000-0000-000000000002",
                "user_id": user["sub"],
                "agency_id": "00000000-0000-0000-0000-000000000003",
                "status": "active",
                "full_name": "Test Consultant",
            }
        res = await client.table("consultants").select("*").eq("user_id", user["sub"]).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Consultant profile not found")
        consultant = res.data[0]
        if consultant.get("status") != "active":
            raise HTTPException(
                status_code=403,
                detail="Consultant account is not yet approved. Please wait for admin approval.",
            )
        return consultant

    return _dep
