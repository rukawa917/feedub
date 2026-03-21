"""
Unit tests for LiteLLM-based LLM provider layer.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.llm.prompts import format_messages_for_llm, get_insights_system_prompt
from src.llm.provider import LLMResponse, complete


class TestLLMProvider:
    """Test suite for LiteLLM complete() function."""

    @pytest.fixture(autouse=True)
    def clear_settings_cache(self):
        from src.core.config import get_settings

        get_settings.cache_clear()
        yield
        get_settings.cache_clear()

    def _mock_settings(self, **overrides):
        defaults = {
            "llm_model": "ollama/llama3.2",
            "llm_api_base": None,
            "llm_fallback_model": None,
            "llm_request_timeout_seconds": 120,
            "llm_max_retries": 2,
        }
        defaults.update(overrides)
        mock = MagicMock()
        for k, v in defaults.items():
            setattr(mock, k, v)
        return mock

    def _mock_litellm_response(
        self,
        content="Test response",
        model="ollama/llama3.2",
        prompt_tokens=10,
        completion_tokens=5,
    ):
        mock_usage = MagicMock()
        mock_usage.__iter__ = MagicMock(
            return_value=iter(
                [
                    ("prompt_tokens", prompt_tokens),
                    ("completion_tokens", completion_tokens),
                ]
            )
        )
        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_response.model = model
        mock_response.usage = mock_usage
        return mock_response

    @pytest.mark.asyncio
    async def test_complete_success(self):
        """Test successful completion via LiteLLM."""
        mock_settings = self._mock_settings()
        mock_response = self._mock_litellm_response()

        with (
            patch("src.llm.provider.get_settings", return_value=mock_settings),
            patch("src.llm.provider.litellm.acompletion", new_callable=AsyncMock) as mock_acomp,
        ):
            mock_acomp.return_value = mock_response
            result = await complete(
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=4096,
            )

        assert isinstance(result, LLMResponse)
        assert result.content == "Test response"
        assert result.model == "ollama/llama3.2"
        mock_acomp.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_uses_custom_model(self):
        """Test complete uses provided model over settings default."""
        mock_settings = self._mock_settings(llm_model="gpt-4o")
        mock_response = self._mock_litellm_response(model="claude-opus-4-5")

        with (
            patch("src.llm.provider.get_settings", return_value=mock_settings),
            patch("src.llm.provider.litellm.acompletion", new_callable=AsyncMock) as mock_acomp,
        ):
            mock_acomp.return_value = mock_response
            result = await complete(
                messages=[{"role": "user", "content": "Hello"}],
                model="claude-opus-4-5",
            )

        assert result.model == "claude-opus-4-5"
        call_kwargs = mock_acomp.call_args[1]
        assert call_kwargs["model"] == "claude-opus-4-5"

    @pytest.mark.asyncio
    async def test_complete_fallback_on_primary_failure(self):
        """Test fallback model is used when primary fails."""
        mock_settings = self._mock_settings(
            llm_model="bad-model",
            llm_fallback_model="ollama/llama3.2",
        )
        fallback_response = self._mock_litellm_response(
            content="Fallback response", model="ollama/llama3.2"
        )

        with (
            patch("src.llm.provider.get_settings", return_value=mock_settings),
            patch("src.llm.provider.litellm.acompletion", new_callable=AsyncMock) as mock_acomp,
        ):
            mock_acomp.side_effect = [Exception("Primary failed"), fallback_response]
            result = await complete(messages=[{"role": "user", "content": "Hello"}])

        assert result.content == "Fallback response"
        assert mock_acomp.call_count == 2
        fallback_call = mock_acomp.call_args_list[1]
        assert fallback_call[1]["model"] == "ollama/llama3.2"

    @pytest.mark.asyncio
    async def test_complete_raises_when_no_fallback(self):
        """Test exception propagates when no fallback model configured."""
        mock_settings = self._mock_settings(llm_fallback_model=None)

        with (
            patch("src.llm.provider.get_settings", return_value=mock_settings),
            patch("src.llm.provider.litellm.acompletion", new_callable=AsyncMock) as mock_acomp,
        ):
            mock_acomp.side_effect = Exception("LLM error")
            with pytest.raises(Exception, match="LLM error"):
                await complete(messages=[{"role": "user", "content": "Hello"}])

    @pytest.mark.asyncio
    async def test_complete_passes_api_base(self):
        """Test api_base is forwarded to litellm (api_key is auto-read from env vars)."""
        mock_settings = self._mock_settings(
            llm_model="gpt-4o",
            llm_api_base="https://custom.api.com",
        )
        mock_response = self._mock_litellm_response(model="gpt-4o")

        with (
            patch("src.llm.provider.get_settings", return_value=mock_settings),
            patch("src.llm.provider.litellm.acompletion", new_callable=AsyncMock) as mock_acomp,
        ):
            mock_acomp.return_value = mock_response
            await complete(messages=[{"role": "user", "content": "Hello"}])

        call_kwargs = mock_acomp.call_args[1]
        assert "api_key" not in call_kwargs
        assert call_kwargs["api_base"] == "https://custom.api.com"


class TestPromptsModule:
    """Test suite for prompts module."""

    def test_insights_system_prompt_exists(self):
        """Test get_insights_system_prompt returns valid prompt."""
        prompt = get_insights_system_prompt()
        assert prompt
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "Summary" in prompt
        assert "Key Updates" in prompt

    def test_insights_system_prompt_english_default(self):
        """Test get_insights_system_prompt defaults to English."""
        prompt = get_insights_system_prompt()
        assert "IMPORTANT: Generate ALL output in" not in prompt

    def test_insights_system_prompt_japanese(self):
        """Test get_insights_system_prompt adds Japanese instruction."""
        prompt = get_insights_system_prompt(language="ja", language_name="Japanese")
        assert "IMPORTANT: Generate ALL output in Japanese" in prompt
        assert "All section headers, summaries, and content must be written in Japanese" in prompt

    def test_insights_system_prompt_spanish(self):
        """Test get_insights_system_prompt adds Spanish instruction."""
        prompt = get_insights_system_prompt(language="es", language_name="Spanish")
        assert "IMPORTANT: Generate ALL output in Spanish" in prompt

    def test_format_messages_for_llm_with_single_chat(self):
        """Test format_messages_for_llm formats messages correctly."""
        from unittest.mock import MagicMock

        msg1 = MagicMock()
        msg1.chat_id = "chat_1"
        msg1.chat_title = "Test Chat"
        msg1.chat_type = "channel"
        msg1.timestamp = MagicMock()
        msg1.timestamp.strftime.return_value = "2024-01-15 10:30"
        msg1.sender_name = "Alice"
        msg1.content = "Hello world"

        msg2 = MagicMock()
        msg2.chat_id = "chat_1"
        msg2.chat_title = "Test Chat"
        msg2.chat_type = "channel"
        msg2.timestamp = MagicMock()
        msg2.timestamp.strftime.return_value = "2024-01-15 10:35"
        msg2.sender_name = "Bob"
        msg2.content = "Hi there"

        messages = [msg1, msg2]
        result = format_messages_for_llm(messages)

        assert "--- Chat: Test Chat (channel) ---" in result
        assert "[2024-01-15 10:30] Alice: Hello world" in result
        assert "[2024-01-15 10:35] Bob: Hi there" in result

    def test_format_messages_for_llm_with_multiple_chats(self):
        """Test format_messages_for_llm separates different chats."""
        from unittest.mock import MagicMock

        msg1 = MagicMock()
        msg1.chat_id = "chat_1"
        msg1.chat_title = "Chat One"
        msg1.chat_type = "group"
        msg1.timestamp = MagicMock()
        msg1.timestamp.strftime.return_value = "2024-01-15 10:00"
        msg1.sender_name = "Alice"
        msg1.content = "Message in chat 1"

        msg2 = MagicMock()
        msg2.chat_id = "chat_2"
        msg2.chat_title = "Chat Two"
        msg2.chat_type = "channel"
        msg2.timestamp = MagicMock()
        msg2.timestamp.strftime.return_value = "2024-01-15 10:05"
        msg2.sender_name = "Bob"
        msg2.content = "Message in chat 2"

        messages = [msg1, msg2]
        result = format_messages_for_llm(messages)

        assert "--- Chat: Chat One (group) ---" in result
        assert "--- Chat: Chat Two (channel) ---" in result
        lines = result.split("\n")
        chat2_idx = lines.index("--- Chat: Chat Two (channel) ---")
        assert lines[chat2_idx - 1] == ""

    def test_format_messages_for_llm_handles_missing_fields(self):
        from unittest.mock import MagicMock

        msg = MagicMock()
        msg.chat_id = "chat_1"
        msg.chat_title = None
        msg.chat_type = "private"
        msg.timestamp = MagicMock()
        msg.timestamp.strftime.return_value = "2024-01-15 10:00"
        msg.sender_name = None
        msg.content = None

        result = format_messages_for_llm([msg])
        assert "--- Chat: Unknown (private) ---" in result
        assert "[2024-01-15 10:00] Unknown: [media]" in result

    def test_format_messages_for_llm_empty_list(self):
        result = format_messages_for_llm([])
        assert result == ""

    def test_format_messages_for_llm_handles_special_characters(self):
        from unittest.mock import MagicMock

        msg = MagicMock()
        msg.chat_id = "chat_1"
        msg.chat_title = "Test & Chat <Special>"
        msg.chat_type = "group"
        msg.timestamp = MagicMock()
        msg.timestamp.strftime.return_value = "2024-01-15 10:00"
        msg.sender_name = "Alice & Bob"
        msg.content = "Message with émojis 🔥 and symbols: <>&'\""

        result = format_messages_for_llm([msg])
        assert "Test & Chat <Special>" in result
        assert "Alice & Bob" in result
        assert "Message with émojis 🔥 and symbols: <>&'\"" in result
