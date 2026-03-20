"""
Health check endpoint for monitoring application status.

Provides comprehensive health check endpoints that return application status,
version, timestamp, and detailed system metrics including database connectivity,
disk space, and memory usage.
"""

import platform
import shutil
import time
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.database import get_async_engine, get_db

router = APIRouter()
settings = get_settings()


class DatabaseHealth(BaseModel):
    """Database health status model."""

    status: str
    error: str | None = None


class ConnectionPoolStats(BaseModel):
    """Database connection pool statistics."""

    pool_size: int
    checked_out: int
    overflow: int
    checked_in: int


class DatabaseDetailedHealth(BaseModel):
    """Detailed database health response for /health/db endpoint."""

    status: str
    latency_ms: float
    pool: ConnectionPoolStats
    error: str | None = None


class DiskHealth(BaseModel):
    """Disk space health metrics model."""

    used_percent: float
    free_gb: float
    total_gb: float


class MemoryHealth(BaseModel):
    """Memory usage health metrics model."""

    used_percent: float
    available_mb: float
    total_mb: float


class HealthResponse(BaseModel):
    """Comprehensive health check response model."""

    status: str
    version: str
    timestamp: datetime
    database: DatabaseHealth
    disk: DiskHealth
    memory: MemoryHealth


class LivenessResponse(BaseModel):
    """Lightweight liveness check response."""

    status: str
    version: str
    timestamp: datetime


@router.get("/health/live", response_model=LivenessResponse)
async def liveness_check() -> LivenessResponse:
    """Public liveness probe. Returns status without system metrics."""
    return LivenessResponse(
        status="ok",
        version=settings.api_version,
        timestamp=datetime.now(UTC),
    )


@router.get("/health", response_model=HealthResponse)
async def health_check(
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> HealthResponse:
    """
    Comprehensive health check endpoint (authenticated).

    Returns system metrics including database, disk, and memory status.
    Use /health/live for unauthenticated liveness probes.
    """
    # Check database connectivity
    db_health = await _check_database(db)

    # Check disk space
    disk_health = _check_disk_space()

    # Check memory usage
    memory_health = _check_memory()

    # Overall status: healthy if all checks pass, unhealthy otherwise
    overall_status = "healthy"
    if db_health.status != "healthy":
        overall_status = "unhealthy"

    return HealthResponse(
        status=overall_status,
        version=settings.api_version,
        timestamp=datetime.now(UTC),
        database=db_health,
        disk=disk_health,
        memory=memory_health,
    )


@router.get("/health/db", response_model=DatabaseDetailedHealth)
async def database_health_check(
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> DatabaseDetailedHealth:
    """
    Detailed database health check endpoint.

    Provides detailed database connectivity information including:
    - Connection latency (ms)
    - Connection pool statistics
    - Overall health status

    This is a lightweight endpoint for monitoring database connectivity
    without the overhead of full system health checks.

    Returns:
        DatabaseDetailedHealth: Detailed database health status with metrics.

    Example:
        GET /health/db
        {
            "status": "healthy",
            "latency_ms": 2.45,
            "pool": {
                "pool_size": 8,
                "checked_out": 1,
                "overflow": 0,
                "checked_in": 7
            },
            "error": null
        }
    """
    try:
        # Measure query latency
        from sqlalchemy import text

        start_time = time.perf_counter()
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        latency_ms = (time.perf_counter() - start_time) * 1000

        # Get connection pool statistics
        engine = get_async_engine()
        pool = engine.pool
        pool_stats = ConnectionPoolStats(
            pool_size=pool.size(),
            checked_out=pool.checkedout(),
            overflow=pool.overflow(),
            checked_in=pool.checkedin(),
        )

        return DatabaseDetailedHealth(
            status="healthy",
            latency_ms=round(latency_ms, 2),
            pool=pool_stats,
        )

    except Exception as e:
        # Still try to get pool stats even on error
        try:
            engine = get_async_engine()
            pool = engine.pool
            pool_stats = ConnectionPoolStats(
                pool_size=pool.size(),
                checked_out=pool.checkedout(),
                overflow=pool.overflow(),
                checked_in=pool.checkedin(),
            )
        except Exception:
            pool_stats = ConnectionPoolStats(
                pool_size=0,
                checked_out=0,
                overflow=0,
                checked_in=0,
            )

        return DatabaseDetailedHealth(
            status="unhealthy",
            latency_ms=-1,
            pool=pool_stats,
            error=str(e)[:500],  # Limit error message length
        )


async def _check_database(db: AsyncSession) -> DatabaseHealth:
    """
    Check database connectivity by executing a simple query.

    Args:
        db: Database session

    Returns:
        DatabaseHealth: Database health status
    """
    try:
        # Execute a simple query to verify database connectivity
        from sqlalchemy import text

        result = await db.execute(text("SELECT 1"))
        result.scalar()

        return DatabaseHealth(status="healthy")
    except Exception as e:
        return DatabaseHealth(status="unhealthy", error=str(e))


def _check_disk_space() -> DiskHealth:
    """
    Check disk space usage on the root filesystem.

    Returns:
        DiskHealth: Disk space metrics
    """
    usage = shutil.disk_usage("/")

    used_percent = (usage.used / usage.total) * 100
    free_gb = usage.free / (1024**3)
    total_gb = usage.total / (1024**3)

    return DiskHealth(
        used_percent=round(used_percent, 2),
        free_gb=round(free_gb, 2),
        total_gb=round(total_gb, 2),
    )


def _check_memory() -> MemoryHealth:
    """
    Check system memory usage.

    On Linux, reads /proc/meminfo directly to avoid the psutil dependency.
    Falls back to zeros on non-Linux platforms (macOS dev).

    Returns:
        MemoryHealth: Memory usage metrics
    """
    if platform.system() == "Linux":
        try:
            meminfo: dict[str, int] = {}
            with open("/proc/meminfo") as f:
                for line in f:
                    parts = line.split(":")
                    if len(parts) == 2:
                        key = parts[0].strip()
                        # Values are in kB
                        val = int(parts[1].strip().split()[0])
                        meminfo[key] = val
                        if len(meminfo) >= 3:
                            break

            total_mb = meminfo.get("MemTotal", 0) / 1024
            available_mb = meminfo.get("MemAvailable", 0) / 1024
            used_percent = ((total_mb - available_mb) / total_mb * 100) if total_mb > 0 else 0

            return MemoryHealth(
                used_percent=round(used_percent, 2),
                available_mb=round(available_mb, 2),
                total_mb=round(total_mb, 2),
            )
        except Exception:
            pass

    # Fallback for non-Linux or errors
    return MemoryHealth(used_percent=0, available_mb=0, total_mb=0)
