from typing import Any, Dict, Optional
import jwt
from fastapi import HTTPException, status
from app.core.config import settings


def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Supabase JWT access token and extracts payload.
    Identity is derived strictly from verified 'sub' claim.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # If secret is set, verify cryptographic signature
    if settings.SUPABASE_JWT_SECRET:
        try:
            # Supabase default algorithm is HS256 with JWT secret
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg", "HS256")
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=[alg],
                audience="authenticated",
                options={"verify_aud": False}, # Supabase tokens usually have aud='authenticated'
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Fallback for development/testing when secret is not configured
        # Decode without verification only if in development, otherwise reject
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase JWT secret is not configured in production",
            )
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Malformed token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject ('sub') claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
