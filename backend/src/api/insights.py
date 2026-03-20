"""Insights API endpoints for LLM-powered message analysis.

This module implements endpoints for:
- Consent management (give/check/revoke)
- Usage tracking (daily limits)
- Request validation (pre-generation checks)
- Insight generation (streaming SSE primary)
- Insight retrieval (get/list)
"""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import (
    ConsentRequiredError,
    InsightGenerationError,
    InsightRateLimitError,
    MessageLimitExceededError,
)
from src.models.user import User
from src.repositories.insights_repository import InsightsRepository
from src.repositories.message_repository import MessageRepository
from src.schemas.insights import (
    ConsentStatusResponse,
    GenerateInsightFromIdsRequest,
    GenerateInsightRequest,
    GiveConsentResponse,
    InsightDetail,
    InsightListResponse,
    InsightSummary,
    RevokeConsentResponse,
    UsageResponse,
    ValidateInsightRequest,
    ValidateInsightResponse,
)
from src.services.insights_service import InsightsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["Insights"])


# =============================================================================
# Dependency Injection
# =============================================================================


def get_insights_repository(
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> InsightsRepository:
    """Dependency injection for InsightsRepository."""
    return InsightsRepository(session)


def get_message_repository(
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> MessageRepository:
    """Dependency injection for MessageRepository."""
    return MessageRepository(session)


def get_insights_service(
    message_repo: MessageRepository = Depends(get_message_repository),  # noqa: B008
    insights_repo: InsightsRepository = Depends(get_insights_repository),  # noqa: B008
) -> InsightsService:
    """Dependency injection for InsightsService."""
    return InsightsService(
        message_repo=message_repo,
        insights_repo=insights_repo,
    )


# =============================================================================
# Consent Endpoints
# =============================================================================


@router.get(
    "/consent/status",
    response_model=ConsentStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Check consent status",
    description="Check if user has given consent for LLM processing",
)
async def get_consent_status(
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> ConsentStatusResponse:
    """Check user's LLM consent status.

    Args:
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        ConsentStatusResponse with consent details.
    """
    logger.info(f"[INSIGHTS] GET /insights/consent/status - user_id={current_user.id}")

    has_consent = await service.check_consent(current_user.id)

    return ConsentStatusResponse(
        has_consent=has_consent,
        consent_version=None,
        current_version="1.0",
        requires_re_consent=False,
    )


@router.post(
    "/consent/give",
    response_model=GiveConsentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Give consent",
    description="Record user's consent for LLM processing of messages",
)
async def give_consent(
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> GiveConsentResponse:
    """Give consent for LLM processing.

    Args:
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        GiveConsentResponse confirming consent was recorded.
    """
    logger.info(f"[INSIGHTS] POST /insights/consent/give - user_id={current_user.id}")

    await service.give_consent(current_user.id)

    return GiveConsentResponse(
        success=True,
        consent_version="1.0",
    )


@router.post(
    "/consent/revoke",
    response_model=RevokeConsentResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke consent",
    description="Revoke user's consent for LLM processing",
)
async def revoke_consent(
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> RevokeConsentResponse:
    """Revoke LLM processing consent.

    Args:
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        RevokeConsentResponse confirming revocation.
    """
    logger.info(f"[INSIGHTS] POST /insights/consent/revoke - user_id={current_user.id}")

    await service.revoke_consent(current_user.id)

    return RevokeConsentResponse(
        success=True,
        revoked_at=None,
    )


# =============================================================================
# Usage Endpoints
# =============================================================================


@router.get(
    "/usage",
    response_model=UsageResponse,
    status_code=status.HTTP_200_OK,
    summary="Check usage limits",
    description="Get user's daily insight generation usage and limits",
)
async def get_usage(
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> UsageResponse:
    """Check daily usage limits.

    Returns the user's daily limit, how many they've used today,
    remaining allowance, and when the limit resets (midnight UTC).

    Args:
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        UsageResponse with usage details.
    """
    logger.info(f"[INSIGHTS] GET /insights/usage - user_id={current_user.id}")

    daily_limit, used_today, remaining, resets_at = await service.check_usage(current_user.id)

    return UsageResponse(
        daily_limit=daily_limit,
        used_today=used_today,
        remaining_today=remaining,
        resets_at=resets_at,
    )


# =============================================================================
# Validation Endpoints
# =============================================================================


@router.post(
    "/validate",
    response_model=ValidateInsightResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate insight request",
    description="Pre-validate insight generation parameters before generating",
)
async def validate_insight_request(
    request: ValidateInsightRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> ValidateInsightResponse:
    """Validate insight generation request.

    Checks if the request parameters are valid before generation.
    Returns message count, token estimates, and suggested filters
    if the request exceeds limits.

    Args:
        request: Validation request with chat_ids and date range.
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        ValidateInsightResponse with validation results.
    """
    logger.info(
        f"[INSIGHTS] POST /insights/validate - "
        f"user_id={current_user.id}, chat_ids={request.chat_ids}"
    )

    # Convert string chat_ids to integers
    chat_ids = [int(cid) for cid in request.chat_ids]

    (
        valid,
        message_count,
        exceeds_limit,
        estimated_tokens,
        max_messages,
        suggested_filters,
    ) = await service.validate_request(
        user_id=current_user.id,
        chat_ids=chat_ids,
        start_date=request.start_date,
        end_date=request.end_date,
    )

    return ValidateInsightResponse(
        valid=valid,
        message_count=message_count,
        exceeds_limit=exceeds_limit,
        estimated_tokens=estimated_tokens,
        max_messages=max_messages,
        suggested_filters=suggested_filters,
    )


# =============================================================================
# Generation Endpoints
# =============================================================================


@router.post(
    "/generate",
    status_code=status.HTTP_200_OK,
    summary="Generate insight (streaming)",
    description="Generate insight using LLM with Server-Sent Events streaming response",
    response_class=StreamingResponse,
)
async def generate_insight_stream(
    request: GenerateInsightRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> StreamingResponse:
    """Generate insight with streaming response.

    Uses Server-Sent Events (SSE) to stream progress and content chunks
    as the insight is generated by the LLM.

    SSE Event Types:
    - status: Progress updates (pending, generating, completed, failed)
    - chunk: Content chunks as they're generated
    - metadata: Token counts, cost, timing after completion
    - error: Error details if generation fails

    Args:
        request: Generation request with chat_ids and date range.
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        StreamingResponse with SSE events.
    """
    logger.info(
        f"[INSIGHTS] POST /insights/generate - "
        f"user_id={current_user.id}, chat_ids={request.chat_ids}"
    )

    # Convert string chat_ids to integers
    chat_ids = [int(cid) for cid in request.chat_ids]

    return _streaming_insight_response(
        service=service,
        user_id=current_user.id,
        generate_fn=lambda: service.generate_insight(
            user_id=current_user.id,
            chat_ids=chat_ids,
            chat_titles=None,
            start_date=request.start_date,
            end_date=request.end_date,
            language=request.language,
        ),
    )


@router.post(
    "/generate-from-ids",
    status_code=status.HTTP_200_OK,
    summary="Generate insight from message IDs (streaming)",
    description="Generate insight from specific message IDs with SSE streaming response",
    response_class=StreamingResponse,
)
async def generate_insight_from_ids_stream(
    request: GenerateInsightFromIdsRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> StreamingResponse:
    """Generate insight from specific message IDs with streaming response.

    Uses Server-Sent Events (SSE) to stream progress and content chunks.
    Accepts a list of message IDs instead of chat_ids/date range filters.

    Args:
        request: Request with message_ids list and optional language.
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        StreamingResponse with SSE events.
    """
    logger.info(
        f"[INSIGHTS] POST /insights/generate-from-ids - "
        f"user_id={current_user.id}, message_ids_count={len(request.message_ids)}"
    )

    return _streaming_insight_response(
        service=service,
        user_id=current_user.id,
        generate_fn=lambda: service.generate_insight_from_ids(
            user_id=current_user.id,
            message_ids=request.message_ids,
            language=request.language,
        ),
    )


def _format_sse_event(data: dict) -> str:
    """Format data as an SSE event string."""
    return f"data: {json.dumps(data)}\n\n"


def _streaming_insight_response(
    service: InsightsService,
    user_id: UUID,
    generate_fn,
) -> StreamingResponse:
    """Create a StreamingResponse with shared SSE insight generation logic.

    Handles consent checks, rate limiting, generation, and error formatting
    in a single place used by both /generate and /generate-from-ids.
    """

    async def event_generator():
        try:
            yield _format_sse_event({"type": "status", "status": "pending"})

            # Check consent
            if not await service.check_consent(user_id):
                yield _format_sse_event(
                    {
                        "type": "error",
                        "error": "consent_required",
                        "detail": "User consent required for insights",
                        "requires_reconsent": False,
                    }
                )
                return

            # Check rate limit
            if not await service.can_generate(user_id):
                daily_limit, used_today, _, reset_at = await service.check_usage(user_id)
                yield _format_sse_event(
                    {
                        "type": "error",
                        "error": "rate_limit_exceeded",
                        "detail": "Daily insight limit exceeded",
                        "reset_at": reset_at.isoformat() if reset_at else None,
                        "daily_limit": daily_limit,
                        "used_today": used_today,
                        "upgrade_required": None,
                    }
                )
                return

            yield _format_sse_event({"type": "status", "status": "generating"})

            try:
                insight = await generate_fn()

                yield _format_sse_event(
                    {"type": "chunk", "content": insight.summary, "insight_id": str(insight.id)}
                )
                yield _format_sse_event(
                    {
                        "type": "metadata",
                        "tokens_used": (insight.input_tokens or 0) + (insight.output_tokens or 0),
                        "input_tokens": insight.input_tokens,
                        "output_tokens": insight.output_tokens,
                        "cost": float(insight.cost_usd) if insight.cost_usd else None,
                        "provider": insight.provider_used,
                        "model": insight.model_used,
                        "generation_time_ms": insight.generation_time_ms,
                    }
                )
                yield _format_sse_event(
                    {"type": "status", "status": "completed", "insight_id": str(insight.id)}
                )

            except ConsentRequiredError as e:
                yield _format_sse_event(
                    {
                        "type": "error",
                        "error": "consent_required",
                        "detail": str(e),
                        "requires_reconsent": e.requires_reconsent,
                    }
                )
            except InsightRateLimitError as e:
                yield _format_sse_event(
                    {
                        "type": "error",
                        "error": "rate_limit_exceeded",
                        "detail": str(e),
                        "reset_at": e.reset_at.isoformat() if e.reset_at else None,
                        "upgrade_required": None,
                    }
                )
            except MessageLimitExceededError as e:
                yield _format_sse_event(
                    {
                        "type": "error",
                        "error": "message_limit_exceeded",
                        "detail": str(e),
                        "count": e.count,
                        "limit": e.limit,
                        "suggested_filters": e.suggested_filters,
                    }
                )
            except InsightGenerationError as e:
                yield _format_sse_event(
                    {"type": "error", "error": "generation_failed", "detail": str(e)}
                )

        except Exception as e:
            logger.exception(f"[INSIGHTS] Streaming error: {e}")
            yield _format_sse_event(
                {"type": "error", "error": "generation_failed", "detail": "An unexpected error occurred. Please try again."}
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


# =============================================================================
# Retrieval Endpoints
# =============================================================================


@router.get(
    "/{insight_id}",
    response_model=InsightDetail,
    status_code=status.HTTP_200_OK,
    summary="Get insight by ID",
    description="Retrieve a specific insight by its ID",
)
async def get_insight(
    insight_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> InsightDetail:
    """Get a specific insight by ID.

    Retrieves full insight details including generated content,
    metadata, and status. Only returns insights owned by the current user.

    Args:
        insight_id: UUID of the insight to retrieve.
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        InsightDetail with full insight data.

    Raises:
        HTTPException: If insight not found or doesn't belong to user.
    """
    logger.info(f"[INSIGHTS] GET /insights/{insight_id} - user_id={current_user.id}")

    insight = await service.get_insight(insight_id, current_user.id)

    if insight is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )

    return InsightDetail.model_validate(insight)


@router.get(
    "/",
    response_model=InsightListResponse,
    status_code=status.HTTP_200_OK,
    summary="List insights",
    description="List user's insights with pagination",
)
async def list_insights(
    limit: int = Query(
        default=20, ge=1, le=100, description="Maximum number of insights to return"
    ),
    offset: int = Query(default=0, ge=0, description="Number of insights to skip"),
    current_user: User = Depends(get_current_user),  # noqa: B008
    service: InsightsService = Depends(get_insights_service),  # noqa: B008
) -> InsightListResponse:
    """List user's insights.

    Returns a paginated list of the user's insights, ordered by
    creation date (most recent first).

    Args:
        limit: Maximum number of insights to return (1-100, default 20).
        offset: Number of insights to skip for pagination.
        current_user: Authenticated user from token.
        service: InsightsService instance.

    Returns:
        InsightListResponse with list of insights and total count.
    """
    logger.info(
        f"[INSIGHTS] GET /insights/ - user_id={current_user.id}, limit={limit}, offset={offset}"
    )

    insights, total = await service.list_insights(current_user.id, limit, offset)

    return InsightListResponse(
        insights=[InsightSummary.model_validate(i) for i in insights],
        total=total,
    )
