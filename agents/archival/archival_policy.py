from datetime import datetime, timedelta, timezone
import os

from dotenv import load_dotenv

load_dotenv()


ARCHIVE_AFTER_HOURS = int(
    os.getenv("ARCHIVE_AFTER_HOURS", "24")
)

def is_old(timestamp):
    """
    Détermine si une donnée EEG est suffisamment ancienne
    pour être archivée.
    """

    if not timestamp:
        return False

    try:
        data_time = datetime.fromisoformat(timestamp)

        if data_time.tzinfo is None:
            data_time = data_time.replace(tzinfo=timezone.utc)

        limit = datetime.now(timezone.utc) - timedelta(
            hours=ARCHIVE_AFTER_HOURS
        )

        return data_time < limit

    except (ValueError, TypeError):
        return False