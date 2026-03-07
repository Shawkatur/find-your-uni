"""
JWT verification via Supabase-issued tokens.
Set BYPASS_AUTH=true in env to skip verification during testing.
"""
from typing import Annotated, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

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
    When BYPASS_AUTH=true, always passes.
    """
    def _check(user: Annotated[dict, Depends(get_current_user)]) -> dict:
        settings = get_settings()
        if settings.BYPASS_AUTH:
            return user
        user_role = (user.get("app_metadata") or {}).get("role", "student")
        if user_role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{role}', got '{user_role}'",
            )
        return user
    return _check
