from typing import List

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from stripe.error import SignatureVerificationError  # type: ignore

from api.app.routers import logger
from api.app.config import settings, PackageID
from api.app.services import purchases as svc
from api.app.auth import (
    verify_clerk_token,
    verify_user_or_guest,
    get_current_user_from_auth,
)
from api.app.middleware.hybrid_rate_limit import (
    default_rate_limit,
    check_hybrid_rate_limit,
)
from shared.models import User
from shared.db import get_session

router = APIRouter(tags=["Purchases"])


@router.get("/packages")
@default_rate_limit
async def list_packages(request: Request) -> dict:
    """List all available packages."""
    return await svc.list_packages()


@router.get(
    "", response_model=List[svc.UserPurchaseRead], response_model_exclude={"stripe_id"}
)
@default_rate_limit
async def get_purchases(
    request: Request,
    db: AsyncSession = Depends(get_session),
    auth_data=Depends(verify_user_or_guest),
    page: int = 1,
    limit: int = 10,
) -> List[svc.UserPurchaseRead]:
    """Get a list of purchases for the authenticated user."""
    user = await get_current_user_from_auth(auth_data, db)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, db, user)

    # Guest users cannot access purchase history
    if user.is_guest:
        raise HTTPException(
            status_code=403,
            detail="Guest users cannot access purchase history. Please create an account.",
        )

    purchases = await svc.get_purchases(db, user.id, page, limit)
    return purchases


@router.post("/checkout")
@default_rate_limit
async def create_checkout(
    request: Request,
    package: PackageID,
    db: AsyncSession = Depends(get_session),
    auth_data=Depends(verify_user_or_guest),
) -> svc.CheckoutSession:
    """Create a new checkout session for the specified package."""
    user = await get_current_user_from_auth(auth_data, db)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, db, user)

    # Guest users cannot make purchases
    if user.is_guest:
        raise HTTPException(
            status_code=403,
            detail="Guest users cannot make purchases. Please create an account to buy credits.",
        )

    try:
        session = await svc.new_checkout_session(user.id, package)
    except ValueError as e:
        logger.warning("Failed to create checkout session: %s", e)
        raise HTTPException(400, str(e)) from e
    return session


@router.post("/webhook")
@default_rate_limit
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> JSONResponse:
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.webhook_secret)
    except SignatureVerificationError as exc:
        logger.error("Stripe signature verification failed: %s", exc)
        raise HTTPException(400, "Invalid signature") from exc

    # Handle event
    logger.info("Received Stripe event: %s", event["type"])
    if event["type"] == "checkout.session.completed":
        data = event["data"]["object"]
        try:
            await svc.apply_checkout_completed(
                db=db,
                metadata=data["metadata"],
                amount_paid=data.get("amount_total", 0),
                currency=data.get("currency", "usd"),
                stripe_session_id=data["id"],
            )
        except Exception as e:
            logger.error("Failed to apply checkout completed: %s", e)
            raise HTTPException(500, "Failed to process checkout") from e
    return JSONResponse(status_code=200, content={"status": "success"})
