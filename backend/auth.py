"""Clerk JWT verification. Every /api route depends on current_user_id.

Fail-closed: if CLERK_ISSUER is unset the app refuses to start, unless
ALLOW_INSECURE_NO_AUTH=true explicitly opts into single-user local mode
(user id "local") for dev and tests.
"""

import logging

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from config import settings

logger = logging.getLogger(__name__)

_jwks: PyJWKClient | None = None
if settings.clerk_issuer:
    _jwks = PyJWKClient(f"{settings.clerk_issuer.rstrip('/')}/.well-known/jwks.json")
elif settings.allow_insecure_no_auth:
    logger.warning("ALLOW_INSECURE_NO_AUTH=true — running WITHOUT authentication (single-user local mode)")
else:
    raise RuntimeError(
        "CLERK_ISSUER is not set. Set it for production, or set "
        "ALLOW_INSECURE_NO_AUTH=true to deliberately run without auth (local dev only)."
    )


async def current_user_id(authorization: str | None = Header(None)) -> str:
    if _jwks is None:
        return "local"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    try:
        # ponytail: get_signing_key_from_jwt does a blocking HTTP fetch on cache
        # miss (keys are cached after that); make async if it ever shows up.
        key = _jwks.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            options={"verify_aud": False},  # Clerk session tokens carry azp, not aud
            leeway=10,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    return claims["sub"]
