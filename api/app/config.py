import os
from pydantic import BaseModel
from typing import Dict, Literal, Optional

PackageID = Literal["SMALL", "MEDIUM", "LARGE"]


class StripeSettings(BaseModel):
    secret_key: str = os.getenv("STRIPE_API_KEY", "")
    webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    frontend_url: str = os.getenv("FRONTEND_APP_URL", "http://localhost:3000")


class Package(BaseModel):
    """
    Represents a package of credits that can be purchased.
    """

    credits: int
    price_id: Optional[str]


def load_packages() -> Dict[PackageID, Package]:
    """
    Load package configurations from environment variables.
    """
    return {
        "SMALL": Package(credits=1_000, price_id=os.getenv("STRIPE_PRICE_SMALL")),
        "MEDIUM": Package(credits=5_000, price_id=os.getenv("STRIPE_PRICE_MEDIUM")),
        "LARGE": Package(credits=10_000, price_id=os.getenv("STRIPE_PRICE_LARGE")),
    }


settings = StripeSettings()
PACKAGES: Dict[PackageID, Package] = load_packages()
