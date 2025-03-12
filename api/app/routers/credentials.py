from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.credentials_crud import (
    create_credential,
    delete_credential,
)
from shared.db import get_session
from shared.crud.credentials_crud import (
    SortField,
    SortOrder,
    get_credential_by_id_and_user,
    list_credentials_for_user,
)
from shared.models import CredentialRead, CredentialCreate, Credential
from shared.secrets_manager import create_secret, delete_secret


router = APIRouter(tags=["Credentials"])


@router.get("", response_model=List[CredentialRead])
async def list_credentials_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[Credential]:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    creds = await list_credentials_for_user(
        session, local_user.id, page, limit, sort, order
    )
    logger.info(f"Getting credentials for user: {local_user.id}")
    return creds


@router.post("", response_model=CredentialRead, status_code=status.HTTP_201_CREATED)
async def create_credential_endpoint(
    credential_in: CredentialCreate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Credential:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    secret_arn = create_secret(credential_in.name, credential_in.value)
    new_cred = await create_credential(
        session, local_user.id, secret_arn, credential_in
    )
    logger.info(f"Created credential: {new_cred.id}")
    return new_cred


@router.get("/{credential_id}", response_model=CredentialRead)
async def get_credential_endpoint(
    credential_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Credential:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    cred = await get_credential_by_id_and_user(session, credential_id, local_user.id)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    logger.info(f"Getting credential: {cred.id}")
    return cred


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential_endpoint(
    credential_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> None:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    cred = await get_credential_by_id_and_user(session, credential_id, local_user.id)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    success = delete_secret(cred.secret_arn)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete secret")

    logger.info(f"Deleting credential: {cred.id}")
    await delete_credential(session, cred)
