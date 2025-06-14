from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.middleware.hybrid_rate_limit import (
    credentials_rate_limit,
    check_hybrid_rate_limit,
)
from api.app.crud.credentials_crud import create_credential, delete_credential
from api.app.routers import logger
from shared.crud.credentials_crud import (
    SortField,
    SortOrder,
    get_credential_by_id_and_user,
    list_credentials_for_user,
)
from shared.db import get_session
from shared.models import Credential, CredentialCreate, CredentialRead
from shared.secrets import create_secret, delete_secret

router = APIRouter(tags=["Credentials"])


@router.get("", response_model=List[CredentialRead])
@credentials_rate_limit
async def list_credentials_endpoint(
    request: Request,
    auth_data=Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[Credential]:
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    creds = await list_credentials_for_user(session, user.id, page, limit, sort, order)
    logger.info("Getting credentials for user: %s", user.id)
    return creds


@router.post("", response_model=CredentialRead, status_code=status.HTTP_201_CREATED)
@credentials_rate_limit
async def create_credential_endpoint(
    request: Request,
    credential_in: CredentialCreate,
    auth_data=Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> Credential:
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    # Create the secret using the appropriate storage method
    secret_id_or_arn = await create_secret(
        session=session,
        secret_name=credential_in.name,
        secret_value=credential_in.value,
        user_id=user.id,
    )

    # Determine if this is a DB secret based on the returned ID/ARN
    is_db_secret = secret_id_or_arn.startswith("db:")

    # Create the credential record
    new_cred = await create_credential(
        session=session,
        user_id=user.id,
        secret_id_or_arn=secret_id_or_arn,
        credential_data=credential_in,
        is_db_secret=is_db_secret,
    )

    logger.info(
        f"Created credential: {new_cred.id} using {'DB' if is_db_secret else 'AWS'} storage"
    )
    return new_cred


@router.get("/{credential_id}", response_model=CredentialRead)
@credentials_rate_limit
async def get_credential_endpoint(
    request: Request,
    credential_id: UUID,
    auth_data=Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> Credential:
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    cred = await get_credential_by_id_and_user(session, credential_id, user.id)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    logger.info("Getting credential: %s", cred.id)
    return cred


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
@credentials_rate_limit
async def delete_credential_endpoint(
    request: Request,
    credential_id: UUID,
    auth_data=Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> None:
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    cred = await get_credential_by_id_and_user(session, credential_id, user.id)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    # Delete the secret using the appropriate storage method
    success = await delete_secret(
        session=session,
        secret_id_or_arn=cred.secret_arn,
        user_id=user.id if cred.is_db_secret else None,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete secret")

    logger.info("Deleting credential: %s", cred.id)
    await delete_credential(session, cred)
