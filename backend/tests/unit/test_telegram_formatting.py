"""Unit tests for Telegram message formatting utilities."""

import time
from dataclasses import dataclass

from src.core.telegram_formatting import (
    entities_to_markdown,
    get_entity_type_name,
    slice_by_utf16_offset,
)


# Mock entity classes to simulate Telethon's MessageEntity types
@dataclass
class MockEntity:
    """Base mock entity with offset and length."""

    offset: int
    length: int


@dataclass
class MessageEntityBold(MockEntity):
    """Mock bold entity."""

    pass


@dataclass
class MessageEntityItalic(MockEntity):
    """Mock italic entity."""

    pass


@dataclass
class MessageEntityCode(MockEntity):
    """Mock inline code entity."""

    pass


@dataclass
class MessageEntityPre(MockEntity):
    """Mock code block entity."""

    language: str = ""


@dataclass
class MessageEntityStrike(MockEntity):
    """Mock strikethrough entity."""

    pass


@dataclass
class MessageEntityUnderline(MockEntity):
    """Mock underline entity."""

    pass


@dataclass
class MessageEntityBlockquote(MockEntity):
    """Mock blockquote entity."""

    pass


@dataclass
class MessageEntityTextUrl(MockEntity):
    """Mock text URL entity."""

    url: str = ""


@dataclass
class MessageEntityMentionName(MockEntity):
    """Mock mention entity."""

    user_id: int = 0


@dataclass
class MessageEntitySpoiler(MockEntity):
    """Mock spoiler entity."""

    pass


class TestSliceByUtf16Offset:
    """Tests for UTF-16 offset slicing."""

    def test_ascii_text(self) -> None:
        """ASCII text works with simple offsets."""
        text = "Hello world"
        assert slice_by_utf16_offset(text, 0, 5) == "Hello"
        assert slice_by_utf16_offset(text, 6, 5) == "world"

    def test_korean_text(self) -> None:
        """Korean characters (2 bytes in UTF-16) work correctly."""
        text = "안녕하세요"  # 5 Korean characters
        # Each Korean char is 1 UTF-16 code unit
        assert slice_by_utf16_offset(text, 0, 2) == "안녕"
        assert slice_by_utf16_offset(text, 2, 3) == "하세요"

    def test_emoji_text(self) -> None:
        """Emoji (surrogate pairs in UTF-16) work correctly."""
        text = "Hi 👋 there"  # 👋 is 2 UTF-16 code units (surrogate pair)
        # "Hi " = 3 units, 👋 = 2 units, " there" = 6 units
        assert slice_by_utf16_offset(text, 0, 3) == "Hi "
        assert slice_by_utf16_offset(text, 3, 2) == "👋"
        assert slice_by_utf16_offset(text, 5, 6) == " there"

    def test_mixed_text(self) -> None:
        """Mixed ASCII, Korean, and emoji work together."""
        text = "Hello 안녕 👋"
        # "Hello " = 6, "안녕" = 2, " " = 1, "👋" = 2
        assert slice_by_utf16_offset(text, 0, 6) == "Hello "
        assert slice_by_utf16_offset(text, 6, 2) == "안녕"

    def test_empty_text(self) -> None:
        """Empty text returns empty string."""
        assert slice_by_utf16_offset("", 0, 5) == ""

    def test_offset_beyond_text(self) -> None:
        """Offset beyond text length returns empty string."""
        assert slice_by_utf16_offset("Hello", 100, 5) == ""

    def test_length_beyond_text(self) -> None:
        """Length extending beyond text is truncated."""
        assert slice_by_utf16_offset("Hello", 0, 100) == "Hello"


class TestGetEntityTypeName:
    """Tests for entity type name extraction."""

    def test_bold_entity(self) -> None:
        """Bold entity returns correct type name."""
        entity = MessageEntityBold(offset=0, length=5)
        assert get_entity_type_name(entity) == "MessageEntityBold"

    def test_italic_entity(self) -> None:
        """Italic entity returns correct type name."""
        entity = MessageEntityItalic(offset=0, length=5)
        assert get_entity_type_name(entity) == "MessageEntityItalic"


class TestEntitiesToMarkdown:
    """Tests for entity to markdown conversion."""

    def test_none_text_returns_none(self) -> None:
        """None text input returns None."""
        assert entities_to_markdown(None, []) is None
        assert entities_to_markdown(None, None) is None

    def test_empty_entities_returns_escaped_text(self) -> None:
        """No entities returns HTML-escaped text."""
        assert entities_to_markdown("Hello world", []) == "Hello world"
        assert entities_to_markdown("Hello world", None) == "Hello world"

    def test_html_escaping(self) -> None:
        """HTML special characters are escaped."""
        text = "<script>alert('xss')</script>"
        result = entities_to_markdown(text, [])
        assert result is not None
        assert "<script>" not in result
        assert "&lt;script&gt;" in result

    def test_bold_text(self) -> None:
        """Bold entity produces <strong> tags."""
        text = "Hello world"
        entities = [MessageEntityBold(offset=6, length=5)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result is not None
        assert result == "Hello <strong>world</strong>"

    def test_italic_text(self) -> None:
        """Italic entity produces <em> tags."""
        text = "Hello world"
        entities = [MessageEntityItalic(offset=0, length=5)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "<em>Hello</em> world"

    def test_inline_code(self) -> None:
        """Code entity produces <code> tags."""
        text = "Use print() here"
        entities = [MessageEntityCode(offset=4, length=7)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "Use <code>print()</code> here"

    def test_code_block_with_language(self) -> None:
        """Pre entity with language produces code block."""
        text = "def foo(): pass"
        entities = [MessageEntityPre(offset=0, length=15, language="python")]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert '<pre><code class="language-python">' in result
        assert "</code></pre>" in result

    def test_code_block_without_language(self) -> None:
        """Pre entity without language produces plain code block."""
        text = "some code"
        entities = [MessageEntityPre(offset=0, length=9, language="")]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert "<pre><code>" in result
        assert "</code></pre>" in result

    def test_strikethrough(self) -> None:
        """Strike entity produces <del> tags."""
        text = "deleted text"
        entities = [MessageEntityStrike(offset=0, length=7)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "<del>deleted</del> text"

    def test_underline(self) -> None:
        """Underline entity produces <u> tags."""
        text = "underlined text"
        entities = [MessageEntityUnderline(offset=0, length=10)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "<u>underlined</u> text"

    def test_blockquote(self) -> None:
        """Blockquote entity produces <blockquote> tags."""
        text = "quoted text"
        entities = [MessageEntityBlockquote(offset=0, length=11)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "<blockquote>quoted text</blockquote>"

    def test_text_url(self) -> None:
        """TextUrl entity produces anchor tags."""
        text = "click here for more"
        entities = [MessageEntityTextUrl(offset=0, length=10, url="https://example.com")]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert '<a href="https://example.com">' in result
        assert "click here</a>" in result

    def test_mention_name(self) -> None:
        """MentionName entity produces tg:// link."""
        text = "@john mentioned"
        entities = [MessageEntityMentionName(offset=0, length=5, user_id=12345)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert '<a href="tg://user?id=12345">' in result

    def test_spoiler(self) -> None:
        """Spoiler entity produces span with class."""
        text = "spoiler content"
        entities = [MessageEntitySpoiler(offset=0, length=7)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert '<span class="spoiler">' in result

    def test_nested_bold_italic(self) -> None:
        """Nested bold inside italic renders correctly."""
        text = "both styled"
        # Italic wraps entire text, bold wraps "both"
        entities = [
            MessageEntityItalic(offset=0, length=11),
            MessageEntityBold(offset=0, length=4),
        ]
        result = entities_to_markdown(text, entities)
        assert result is not None
        # Both tags should be present
        assert "<strong>" in result
        assert "</strong>" in result
        assert "<em>" in result
        assert "</em>" in result

    def test_multiple_sequential_entities(self) -> None:
        """Multiple entities in sequence render correctly."""
        text = "bold italic code"
        entities = [
            MessageEntityBold(offset=0, length=4),
            MessageEntityItalic(offset=5, length=6),
            MessageEntityCode(offset=12, length=4),
        ]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert "<strong>bold</strong>" in result
        assert "<em>italic</em>" in result
        assert "<code>code</code>" in result

    def test_entity_at_string_start(self) -> None:
        """Entity at position 0 works correctly."""
        text = "bold rest"
        entities = [MessageEntityBold(offset=0, length=4)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "<strong>bold</strong> rest"

    def test_entity_at_string_end(self) -> None:
        """Entity at end of string works correctly."""
        text = "rest bold"
        entities = [MessageEntityBold(offset=5, length=4)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result == "rest <strong>bold</strong>"

    def test_unicode_text_with_entities(self) -> None:
        """Korean text with entities works correctly."""
        text = "안녕하세요 세계"  # "Hello world" in Korean
        # Bold the first word (5 chars)
        entities = [MessageEntityBold(offset=0, length=5)]
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert "<strong>안녕하세요</strong>" in result
        assert " 세계" in result

    def test_malformed_entity_offset_too_large(self) -> None:
        """Entity with offset beyond text length is handled gracefully."""
        text = "short"
        entities = [MessageEntityBold(offset=100, length=5)]
        # Should not crash, just return escaped text
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result is not None
        # The entity should be ignored since it's out of bounds

    def test_malformed_entity_negative_offset(self) -> None:
        """Entity with negative offset is handled gracefully."""
        text = "test"
        entities = [MessageEntityBold(offset=-1, length=5)]
        # Should not crash
        result = entities_to_markdown(text, entities)
        assert result is not None
        assert result is not None

    def test_url_escaping_in_text_url(self) -> None:
        """URLs in TextUrl entities are properly escaped."""
        text = "click"
        entities = [
            MessageEntityTextUrl(
                offset=0, length=5, url='https://example.com/path?q=<script>"test"'
            )
        ]
        result = entities_to_markdown(text, entities)
        assert result is not None
        # HTML special chars in URL should be escaped
        assert "&lt;script&gt;" in result or "%3Cscript%3E" in result or "script" in result
        assert "<script>" not in result  # No raw script tag

    def test_performance_large_message(self) -> None:
        """Large message with many entities processes in reasonable time."""
        # Create a 10,000 character message with entities every 100 chars
        text = "x" * 10000
        entities = [MessageEntityBold(offset=i * 100, length=10) for i in range(100)]

        start_time = time.time()
        result = entities_to_markdown(text, entities)
        assert result is not None
        elapsed = time.time() - start_time

        assert result is not None
        assert elapsed < 0.5  # Should complete in under 500ms (generous for CI)
        assert result.count("<strong>") == 100
