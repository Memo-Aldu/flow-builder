from uuid import UUID
from typing import Optional, List
from datetime import datetime

import stripe
from sqlmodel import select
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.config import settings, PACKAGES, Package, PackageID
from api.app.crud.balance_crud import get_balance_by_user_id
from api.app.crud.purchase_crud import create_user_purchase

from shared.models import UserPurchase, UserPurchaseCreate, UserPurchaseRead

stripe.api_key = settings.secret_key


class CheckoutSession(BaseModel):
    """Stripe checkout session."""

    id: str
    url: str


async def list_packages() -> dict:
    """List all available packages."""
    return {
        package_id: {
            "credits": pkg.credits,
            "price_id": pkg.price_id,
        }
        for package_id, pkg in PACKAGES.items()
        if pkg.price_id
    }


async def get_purchases(
    db: AsyncSession,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
) -> List[UserPurchaseRead]:
    stmt = (
        select(UserPurchase)
        .where(UserPurchase.user_id == user_id)
        .order_by(getattr(UserPurchase, "date").desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.exec(stmt)
    return [UserPurchaseRead.model_validate(purchase) for purchase in result.all()]


async def new_checkout_session(
    user_id: UUID,
    package_id: PackageID,
) -> CheckoutSession:
    """Return hosted‑checkout URL for the chosen package."""
    pkg: Package = _require_package(package_id)

    if not pkg.price_id:
        raise ValueError(f"Package {package_id} not configured")

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        invoice_creation={"enabled": True},
        success_url=f"{settings.frontend_url}/dashboard/billing?status=success",
        cancel_url=f"{settings.frontend_url}/dashboard/billing?status=cancel",
        line_items=[{"price": pkg.price_id, "quantity": 1}],
        metadata={"user_id": str(user_id), "package_id": package_id},
    )
    if not session.url:
        raise ValueError("Failed to create checkout session")

    return CheckoutSession(id=session.id, url=session.url)


async def apply_checkout_completed(
    db: AsyncSession,
    metadata: dict,
    amount_paid: int,
    currency: str,
    stripe_session_id: str,
) -> None:
    """Grant credits & log purchase when Stripe says payment succeeded."""
    package_id: Optional[PackageID] = metadata.get("package_id", None)
    user_id = UUID(metadata.get("user_id", None))

    if not package_id or not user_id:
        raise ValueError("Missing package_id or user_id in metadata")

    pkg: Package = _require_package(package_id)

    balance = await get_balance_by_user_id(db, user_id)
    balance.credits += pkg.credits
    balance.updated_at = datetime.now()
    db.add(balance)

    purchase = UserPurchaseCreate(
        stripe_id=stripe_session_id,
        description=f"Purchased {pkg.credits} package.",
        amount=amount_paid,
        currency=currency.upper(),
    )
    await create_user_purchase(db, user_id, purchase)
    await db.commit()


def _require_package(package_id: PackageID) -> Package:
    pkg = PACKAGES.get(package_id)
    if not pkg or not pkg.price_id:
        raise ValueError(f"Package {package_id} not configured")
    return pkg
