"""
Telegram message formatting utilities.

Converts Telegram message entities to Markdown/HTML for rendering.
Handles UTF-16 offset conversion (Telegram uses UTF-16 code units).
"""

import html
from typing import Any


def slice_by_utf16_offset(text: str, offset: int, length: int) -> str:
    """Extract substring using UTF-16 offsets (Telegram's format).

    Telegram uses UTF-16 code units for entity offsets, but Python strings
    use Unicode code points. This function handles the conversion.

    Args:
        text: The original text string.
        offset: Start position in UTF-16 code units.
        length: Length in UTF-16 code units.

    Returns:
        The extracted substring.
    """
    if not text:
        return ""

    # Encode to UTF-16-LE (Little Endian, no BOM)
    encoded = text.encode("utf-16-le")
    # Each UTF-16 code unit is 2 bytes
    start_byte = offset * 2
    end_byte = (offset + length) * 2

    # Bounds checking
    if start_byte >= len(encoded):
        return ""
    end_byte = min(end_byte, len(encoded))

    try:
        return encoded[start_byte:end_byte].decode("utf-16-le")
    except UnicodeDecodeError:
        return ""


def get_entity_type_name(entity: Any) -> str:
    """Get the type name of a Telegram entity.

    Args:
        entity: A Telethon MessageEntity object.

    Returns:
        The entity type name (e.g., 'MessageEntityBold').
    """
    return type(entity).__name__


def entities_to_markdown(text: str | None, entities: list | None) -> str | None:
    """Convert Telegram message with entities to Markdown/HTML string.

    Uses HTML tags for formatting to support reliable nesting of entities.
    The output is designed to be rendered by react-markdown with rehype-raw.

    Args:
        text: The message text content.
        entities: List of Telethon MessageEntity objects.

    Returns:
        Formatted string with HTML/Markdown, or None if text is None.
    """
    if text is None:
        return None

    if not entities:
        # No entities, just escape HTML and return
        return html.escape(text)

    # Build a list of events (entity starts and ends) with their positions
    # Using UTF-16 positions for correct Telegram offset handling
    events: list[tuple[int, str, str, Any]] = []  # (pos, 'start'/'end', tag, entity)

    for entity in entities:
        entity_type = get_entity_type_name(entity)
        offset = getattr(entity, "offset", 0)
        length = getattr(entity, "length", 0)

        # Map entity types to HTML tags
        tag_info = _get_tag_for_entity(entity, entity_type)
        if tag_info:
            open_tag, close_tag = tag_info
            events.append((offset, "start", open_tag, entity))
            events.append((offset + length, "end", close_tag, entity))

    # Sort events: by position, then ends before starts at same position
    # This ensures proper nesting when entities share boundaries
    events.sort(key=lambda e: (e[0], 0 if e[1] == "end" else 1))

    # Build output by processing character by character (in UTF-16 units)
    # Optimize: Pre-encode once and reuse to avoid O(n²) performance
    encoded = text.encode("utf-16-le")
    total_units = len(encoded) // 2

    result_parts: list[str] = []
    current_pos = 0
    event_idx = 0

    while current_pos <= total_units:
        # Process all events at current position
        while event_idx < len(events) and events[event_idx][0] == current_pos:
            _, event_type, tag, _ = events[event_idx]
            result_parts.append(tag)
            event_idx += 1

        # Add the next character (if not at end)
        if current_pos < total_units:
            # Optimize: Extract character directly from pre-encoded bytes
            start_byte = current_pos * 2
            end_byte = start_byte + 2
            if end_byte <= len(encoded):
                try:
                    char = encoded[start_byte:end_byte].decode("utf-16-le")
                    result_parts.append(html.escape(char))
                except UnicodeDecodeError:
                    # Skip invalid characters
                    pass

        current_pos += 1

    return "".join(result_parts)


def _get_tag_for_entity(entity: Any, entity_type: str) -> tuple[str, str] | None:
    """Get the HTML open/close tags for a Telegram entity.

    Args:
        entity: The Telethon entity object (for accessing extra attributes).
        entity_type: The entity type name.

    Returns:
        Tuple of (open_tag, close_tag), or None if entity should be ignored.
    """
    # Map entity types to HTML tags
    tag_map: dict[str, tuple[str, str]] = {
        "MessageEntityBold": ("<strong>", "</strong>"),
        "MessageEntityItalic": ("<em>", "</em>"),
        "MessageEntityCode": ("<code>", "</code>"),
        "MessageEntityUnderline": ("<u>", "</u>"),
        "MessageEntityStrike": ("<del>", "</del>"),
        "MessageEntityBlockquote": ("<blockquote>", "</blockquote>"),
        "MessageEntitySpoiler": ('<span class="spoiler">', "</span>"),
    }

    if entity_type in tag_map:
        return tag_map[entity_type]

    # Handle special entities with attributes
    if entity_type == "MessageEntityPre":
        # Code block with optional language
        language = getattr(entity, "language", "") or ""
        if language:
            return (f'<pre><code class="language-{html.escape(language)}">', "</code></pre>")
        return ("<pre><code>", "</code></pre>")

    if entity_type == "MessageEntityTextUrl":
        # Hyperlink with custom URL
        url = getattr(entity, "url", "") or ""
        safe_url = html.escape(url)
        return (f'<a href="{safe_url}">', "</a>")

    if entity_type == "MessageEntityMentionName":
        # User mention with ID
        user_id = getattr(entity, "user_id", "")
        return (f'<a href="tg://user?id={user_id}">', "</a>")

    # These entities don't need conversion - text already contains visible form:
    # MessageEntityUrl, MessageEntityEmail, MessageEntityPhone,
    # MessageEntityMention, MessageEntityHashtag, MessageEntityCashtag,
    # MessageEntityBotCommand, MessageEntityCustomEmoji

    return None
