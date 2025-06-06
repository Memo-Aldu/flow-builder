from croniter import croniter, CroniterBadCronError
from datetime import datetime, timezone
from typing import Optional


def get_next_run_date(cron_expr: str, base: Optional[datetime] = None) -> datetime:
    """
    Returns the next scheduled run date for the given cron expression.

    Note: This function expects cron expressions to be in UTC timezone.
    The frontend converts user timezone cron expressions to UTC before storage.

    Args:
        cron_expr (str): A valid cron expression in UTC timezone.
        base (Optional[datetime]): The base datetime from which to calculate the next run.
                                   Defaults to the current UTC datetime if not provided.

    Returns:
        datetime: The next run date in UTC.

    Raises:
        ValueError: If the cron expression is invalid.
    """
    base = base or datetime.now(timezone.utc)
    try:
        itr = croniter(cron_expr, base)
        return itr.get_next(datetime)
    except CroniterBadCronError as e:
        raise ValueError("Invalid cron expression") from e


def utcnow() -> datetime:
    """
    Returns the current UTC datetime.

    Returns:
        datetime: The current UTC datetime.
    """
    return datetime.now(timezone.utc)
