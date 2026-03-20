"""LiteLLM-based LLM provider."""

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


async def complete(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> LLMResponse:
    settings = get_settings()
    model = model or settings.llm_model
    try:
        response = await litellm.acompletion(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.llm_api_key or None,
            api_base=settings.llm_api_base or None,
            timeout=settings.llm_request_timeout_seconds,
            num_retries=settings.llm_max_retries,
        )
        return LLMResponse(
            content=response.choices[0].message.content,
            model=response.model,
            usage=dict(response.usage) if response.usage else {},
        )
    except Exception:
        if settings.llm_fallback_model:
            logger.warning(f"Primary LLM failed, trying fallback: {settings.llm_fallback_model}")
            response = await litellm.acompletion(
                model=settings.llm_fallback_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.llm_api_key or None,
                api_base=settings.llm_api_base or None,
                timeout=settings.llm_request_timeout_seconds,
            )
            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=dict(response.usage) if response.usage else {},
            )
        raise
