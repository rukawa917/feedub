"""LiteLLM-based LLM provider.

LiteLLM auto-reads provider-specific API keys from environment variables
(e.g. OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY).
No explicit api_key parameter is needed — just set the right env var.

Full provider list: https://docs.litellm.ai/docs/providers
"""

import asyncio
import logging
from dataclasses import dataclass

import litellm

from src.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    content: str
    model: str
    usage: dict


async def _call_litellm(
    model: str,
    messages: list[dict],
    temperature: float,
    max_tokens: int,
    timeout_seconds: int,
    **kwargs,
) -> LLMResponse:
    """Call litellm.acompletion with a hard asyncio timeout as a safety net."""
    try:
        response = await asyncio.wait_for(
            litellm.acompletion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout_seconds,
                **kwargs,
            ),
            timeout=timeout_seconds + 10,  # asyncio hard cap slightly beyond litellm's
        )
    except asyncio.TimeoutError:
        raise TimeoutError(
            f"LLM request timed out after {timeout_seconds}s (model={model})"
        )
    return LLMResponse(
        content=response.choices[0].message.content,
        model=response.model,
        usage=dict(response.usage) if response.usage else {},
    )


async def complete(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> LLMResponse:
    settings = get_settings()
    model = model or settings.llm_model
    try:
        return await _call_litellm(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout_seconds=settings.llm_request_timeout_seconds,
            api_base=settings.llm_api_base or None,
            num_retries=settings.llm_max_retries,
        )
    except Exception:
        if settings.llm_fallback_model:
            logger.warning(f"Primary LLM failed, trying fallback: {settings.llm_fallback_model}")
            return await _call_litellm(
                model=settings.llm_fallback_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout_seconds=settings.llm_request_timeout_seconds,
                api_base=settings.llm_api_base or None,
            )
        raise
