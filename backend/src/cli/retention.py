"""
Message retention management command.

Deletes messages older than the configured retention period based on fetched_at timestamp.
Designed to be run as a scheduled job (systemd timer or cron).

Usage:
    uv run python -m src.cli.retention [--dry-run] [--verbose]

Environment Variables:
    MESSAGE_RETENTION_DAYS: Number of days to retain (default: 7)
    DATABASE_URL: PostgreSQL connection string (required)
"""

import asyncio
import logging
import sys
from datetime import UTC, datetime, timedelta

import click

from src.core.config import get_settings
from src.core.database import close_db_connections, get_async_session_maker
from src.models.message import Message
from src.repositories.message_repository import MessageRepository

# Ensure models are imported for SQLAlchemy metadata
_ = Message

logger = logging.getLogger(__name__)


async def count_expired_messages(retention_days: int) -> int:
    """Count messages that would be deleted based on retention policy.

    Args:
        retention_days: Number of days to retain messages.

    Returns:
        Count of messages older than retention period.
    """
    from sqlalchemy import func, select

    cutoff_date = datetime.now(UTC) - timedelta(days=retention_days)

    session_maker = get_async_session_maker()
    async with session_maker() as session:
        stmt = select(func.count(Message.id)).where(Message.fetched_at < cutoff_date)
        result = await session.execute(stmt)
        count = result.scalar_one()
        return count if count is not None else 0


async def run_retention(retention_days: int, dry_run: bool = False) -> dict:
    """Execute the retention policy for messages.

    Args:
        retention_days: Number of days to retain messages.
        dry_run: If True, count but don't delete.

    Returns:
        Dict with execution results.
    """
    start_time = datetime.now(UTC)

    try:
        if dry_run:
            message_count = await count_expired_messages(retention_days)
            return {
                "status": "dry_run",
                "messages_to_delete": message_count,
                "retention_days": retention_days,
                "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
            }

        # Execute actual deletion
        session_maker = get_async_session_maker()
        async with session_maker() as session:
            message_repo = MessageRepository(session)
            messages_deleted = await message_repo.delete_expired_messages(
                retention_days=retention_days,
                batch_size=1000,
            )

        return {
            "status": "completed",
            "messages_deleted": messages_deleted,
            "retention_days": retention_days,
            "duration_seconds": (datetime.now(UTC) - start_time).total_seconds(),
        }
    finally:
        await close_db_connections()


@click.command()
@click.option("--dry-run", is_flag=True, help="Count items without deleting")
@click.option("--verbose", is_flag=True, help="Enable verbose logging")
def main(dry_run: bool, verbose: bool) -> None:
    """Execute message retention policy.

    Deletes messages older than MESSAGE_RETENTION_DAYS (default: 7) based on
    their fetched_at timestamp. Use --dry-run to count without deleting.
    """
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    settings = get_settings()

    logger.info(
        f"Starting retention job: retention_days={settings.message_retention_days}, "
        f"dry_run={dry_run}"
    )

    try:
        result = asyncio.run(run_retention(settings.message_retention_days, dry_run=dry_run))

        if result["status"] == "dry_run":
            logger.info(
                f"DRY RUN: Would delete {result['messages_to_delete']} messages "
                f"older than {result['retention_days']} days"
            )
        else:
            logger.info(
                f"COMPLETED: Deleted {result['messages_deleted']} messages "
                f"older than {result['retention_days']} days "
                f"in {result['duration_seconds']:.2f}s"
            )

        sys.exit(0)

    except Exception as e:
        logger.error(f"Retention job failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
