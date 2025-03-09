from croniter import croniter, CroniterBadCronError
from datetime import datetime
from typing import Optional


def get_next_run_date(cron_expr: str, base: Optional[datetime] = None) -> datetime:
    """
    Returns the next scheduled run date for the given cron expression.

    Args:
        cron_expr (str): A valid cron expression.
        base (Optional[datetime]): The base datetime from which to calculate the next run.
                                   Defaults to the current datetime if not provided.

    Returns:
        datetime: The next run date.

    Raises:
        ValueError: If the cron expression is invalid.
    """
    base = base or datetime.now()
    try:
        itr = croniter(cron_expr, base)
        return itr.get_next(datetime)
    except CroniterBadCronError as e:
        raise ValueError("Invalid cron expression") from e
