import os
from typing import Any, Dict, Optional

import httpx
from clerk_backend_api import Clerk
from fastapi import Request, HTTPException
from clerk_backend_api.jwks_helpers import (
    authenticate_request,
    AuthenticateRequestOptions,
)


def get_clerk_secret_key() -> str:
    return os.getenv("CLERK_SECRET_KEY", "")


def get_authorized_party_url() -> list[str]:
    return [os.getenv("CLERK_FRONTEND_URL", "http://localhost:3000")]


clerk_client = Clerk(bearer_auth=get_clerk_secret_key())


# Middleware dependency to verify Clerk tokens
async def verify_clerk_token(request: Request) -> Optional[Dict[str, Any]]:
    try:
        httpx_request = httpx.Request(
            method=request.method,
            url=str(request.url),
            headers=request.headers,
            content=await request.body(),
        )

        request_state = authenticate_request(
            clerk_client,
            httpx_request,
            AuthenticateRequestOptions(),
        )

        if not request_state.is_signed_in:
            raise HTTPException(
                status_code=401, detail="Unauthorized: Token is invalid or expired"
            )

        return request_state.payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}") from e
