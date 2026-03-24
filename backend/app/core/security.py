"""
JWT verification via Supabase-issued tokens.
Supports both legacy HS256 and newer EdDSA (Ed25519) Supabase projects.
Set BYPASS_AUTH=true in env to skip verification during testing.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Annotated, Optional
import hmac
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AsyncClient

from app.core.config import get_settings
from app.core.logger import logger

bearer_scheme = HTTPBearer(auto_error=False)

# Test user returned when BYPASS_AUTH=true
TEST_USER = {
    "sub": "00000000-0000-0000-0000-000000000001",
    "email": "guest@test.com",
    "app_metadata": {"role": "student"},
    "user_metadata": {"full_name": "Guest User"},
    "role": "authenticated",
}

# Cache the JWKS client (it has internal caching of keys)
_jwks_client: Optional[PyJWKClient] = None


def _get_jwks_client() -> PyJWKClient:
    """Lazily create a JWKS client pointing at the Supabase JWKS endpoint."""
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        logger.info("JWKS client initialized: %s", jwks_url)
    return _jwks_client


def verify_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Returns the payload dict.

    Tries HMAC (HS256) first using SUPABASE_JWT_SECRET, then falls back
    to JWKS-based verification for EdDSA / RS256 tokens (newer Supabase projects).
    """
    settings = get_settings()

    # Peek at the token header to decide verification strategy
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "unknown")
        logger.info("JWT header alg=%s", alg)
    except Exception:
        alg = "unknown"

    # --- Strategy 1: HMAC (legacy Supabase projects) ---
    if alg.startswith("HS"):
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS384", "HS512"],
                audience="authenticated",
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        except jwt.InvalidTokenError as exc:
            logger.error("HMAC JWT verification failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # --- Strategy 2: JWKS (EdDSA / RS256 — newer Supabase projects) ---
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA", "ES256", "RS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        logger.error("JWKS JWT verification failed (alg=%s): %s", alg, exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as exc:
        logger.error("JWKS fetch/verify error: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token verification failed")


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
) -> dict:
    """FastAPI dependency — returns the JWT payload for the authenticated user.
    When BYPASS_AUTH=true, returns a test user without checking any token."""
    settings = get_settings()
    if settings.BYPASS_AUTH:
        if settings.APP_ENV == "production":
            logger.critical("BYPASS_AUTH is enabled in production! Ignoring.")
        else:
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
        if settings.BYPASS_AUTH and settings.APP_ENV != "production":
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
        if settings.BYPASS_AUTH and settings.APP_ENV != "production":
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
