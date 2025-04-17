from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import UserPurchase, UserPurchaseCreate


async def create_user_purchase(
    session: AsyncSession, user_id: UUID, purchase_in: UserPurchaseCreate
) -> UserPurchase:
    """
    Saves a record in user_purchase to track the user’s purchase.
    """
    db_purchase = UserPurchase(
        user_id=user_id,
        stripe_id=purchase_in.stripe_id,
        description=purchase_in.description,
        amount=purchase_in.amount,
        currency=purchase_in.currency,
        date=purchase_in.date,
    )
    session.add(db_purchase)
    await session.commit()
    await session.refresh(db_purchase)
    return db_purchase
