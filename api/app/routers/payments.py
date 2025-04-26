import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from stripe.error import SignatureVerificationError  # type: ignore

from api.app.routers import logger
from api.app.config import settings, PackageID
from api.app.services import payments as svc
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from shared.db import get_session

router = APIRouter(tags=["Payments"])


@router.post("/checkout")
async def create_checkout(
    package: PackageID,
    db: AsyncSession = Depends(get_session),
    user_info: dict = Depends(verify_clerk_token),
) -> svc.CheckoutSession:
    """Create a new checkout session for the specified package."""

    user = await get_local_user_by_clerk_id(db, user_info["sub"])
    if not user:
        raise HTTPException(404, "User not found")

    try:
        session = await svc.new_checkout_session(user.id, package)
    except ValueError as e:
        logger.warning(f"Failed to create checkout session: {e}")
        raise HTTPException(400, str(e)) from e
    return session


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> JSONResponse:
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.webhook_secret)
    except SignatureVerificationError as exc:
        logger.error(f"Stripe signature verification failed: {exc}")
        raise HTTPException(400, "Invalid signature") from exc

    # Handle event
    logger.info(f"Received Stripe event: {event['type']}")
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
            logger.error(f"Failed to apply checkout completed: {e}")
            raise HTTPException(500, "Failed to process checkout") from e
    return JSONResponse(status_code=200, content={"status": "success"})
