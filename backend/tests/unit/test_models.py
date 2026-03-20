"""
Unit tests for database models.

Tests User, Message, and MessageFetch model definitions, relationships, and constraints.
"""

from uuid import uuid4

from sqlalchemy import inspect

from src.models.message import Message
from src.models.message_fetch import MessageFetch
from src.models.user import User


class TestUserModel:
    """Test suite for User model."""

    def test_user_model_has_correct_table_name(self):
        """Test that User model maps to correct table name."""
        assert User.__tablename__ == "users"

    def test_user_model_has_required_columns(self):
        """Test that User model has all required columns."""
        mapper = inspect(User)
        column_names = [column.key for column in mapper.columns]

        required_columns = [
            "id",
            "phone_number",
            "telegram_user_id",
            "session_string",
            "temp_session_string",
            "created_at",
            "last_login_at",
        ]

        for col in required_columns:
            assert col in column_names

    def test_user_model_id_is_primary_key(self):
        """Test that id column is the primary key."""
        mapper = inspect(User)
        primary_keys = [key.name for key in mapper.primary_key]

        assert "id" in primary_keys
        assert len(primary_keys) == 1

    def test_user_model_phone_number_constraints(self):
        """Test phone_number column constraints."""
        mapper = inspect(User)
        phone_col = mapper.columns["phone_number"]

        assert phone_col.nullable is False
        assert phone_col.unique is True

    def test_user_model_telegram_user_id_constraints(self):
        """Test telegram_user_id column constraints."""
        mapper = inspect(User)
        telegram_id_col = mapper.columns["telegram_user_id"]

        assert telegram_id_col.nullable is True
        assert telegram_id_col.unique is True

    def test_user_model_has_relationships(self):
        """Test that User model has relationships defined."""
        mapper = inspect(User)
        relationship_names = [rel.key for rel in mapper.relationships]

        assert "messages" in relationship_names
        assert "message_fetches" in relationship_names

    def test_user_model_repr(self):
        """Test User model __repr__ masks phone number."""
        user = User()
        user.id = uuid4()
        user.phone_number = "+1234567890"
        user.telegram_user_id = 123456

        repr_str = repr(user)

        assert "User" in repr_str
        assert str(user.id) in repr_str
        assert "+123***7890" in repr_str
        assert "+1234567890" not in repr_str


class TestMessageModel:
    """Test suite for Message model."""

    def test_message_model_has_correct_table_name(self):
        """Test that Message model maps to correct table name."""
        assert Message.__tablename__ == "messages"

    def test_message_model_has_required_columns(self):
        """Test that Message model has all required columns."""
        mapper = inspect(Message)
        column_names = [column.key for column in mapper.columns]

        required_columns = [
            "id",
            "user_id",
            "telegram_message_id",
            "chat_id",
            "chat_title",
            "chat_type",
            "sender_id",
            "sender_name",
            "content",
            "message_type",
            "has_media",
            "file_id",
            "file_name",
            "file_mime_type",
            "file_size",
            "file_duration",
            "file_width",
            "file_height",
            "is_reply",
            "is_forward",
            "additional_metadata",
            "fetch_id",
            "timestamp",
            "fetched_at",
        ]

        for col in required_columns:
            assert col in column_names, f"Missing column: {col}"

        assert len(column_names) == len(required_columns)

    def test_message_model_id_is_primary_key(self):
        """Test that id column is the primary key."""
        mapper = inspect(Message)
        primary_keys = [key.name for key in mapper.primary_key]

        assert "id" in primary_keys
        assert len(primary_keys) == 1

    def test_message_model_foreign_keys(self):
        """Test that Message model has correct foreign keys."""
        mapper = inspect(Message)
        user_id_col = mapper.columns["user_id"]

        # Check foreign key exists
        assert len(user_id_col.foreign_keys) == 1
        fk = list(user_id_col.foreign_keys)[0]
        assert "users.id" in str(fk.target_fullname)

    def test_message_model_nullable_constraints(self):
        """Test nullable constraints on Message columns."""
        mapper = inspect(Message)

        # Required (NOT NULL) columns
        required_cols = [
            "id",
            "user_id",
            "telegram_message_id",
            "chat_id",
            "chat_type",
            "message_type",
            "has_media",
            "is_reply",
            "is_forward",
            "timestamp",
            "fetched_at",
        ]

        for col_name in required_cols:
            col = mapper.columns[col_name]
            assert col.nullable is False, f"{col_name} should be NOT NULL"

        # Optional (NULL) columns
        optional_cols = [
            "chat_title",
            "sender_id",
            "sender_name",
            "content",
            "file_id",
            "file_name",
            "file_mime_type",
            "file_size",
            "file_duration",
            "file_width",
            "file_height",
            "additional_metadata",
        ]

        for col_name in optional_cols:
            col = mapper.columns[col_name]
            assert col.nullable is True, f"{col_name} should be NULL"

    def test_message_model_has_indexes(self):
        """Test that Message model has required indexes defined."""
        # Indexes are defined in __table_args__ but checked at table level
        indexes = Message.__table_args__

        index_names = []
        for item in indexes:
            if hasattr(item, "name"):
                index_names.append(item.name)

        assert "idx_messages_user_time" in index_names
        assert "idx_messages_user_chat_time" in index_names
        assert "idx_messages_media" in index_names

    def test_message_model_has_relationship_to_user(self):
        """Test that Message model has relationship to User."""
        mapper = inspect(Message)
        relationship_names = [rel.key for rel in mapper.relationships]

        assert "user" in relationship_names

    def test_message_model_repr(self):
        """Test Message model __repr__ method."""
        message = Message()
        message.id = uuid4()
        message.user_id = uuid4()
        message.telegram_message_id = 12345
        message.chat_id = 67890
        message.message_type = "text"

        repr_str = repr(message)

        assert "Message" in repr_str
        assert str(message.id) in repr_str
        assert str(message.user_id) in repr_str
        assert "12345" in repr_str
        assert "67890" in repr_str
        assert "text" in repr_str


class TestMessageFetchModel:
    """Test suite for MessageFetch model."""

    def test_message_fetch_model_has_correct_table_name(self):
        """Test that MessageFetch model maps to correct table name."""
        assert MessageFetch.__tablename__ == "message_fetches"

    def test_message_fetch_model_has_required_columns(self):
        """Test that MessageFetch model has all required columns."""
        mapper = inspect(MessageFetch)
        column_names = [column.key for column in mapper.columns]

        required_columns = [
            "id",
            "user_id",
            "status",
            "messages_count",
            "started_at",
            "completed_at",
            "error_message",
        ]

        for col in required_columns:
            assert col in column_names

    def test_message_fetch_model_id_is_primary_key(self):
        """Test that id column is the primary key."""
        mapper = inspect(MessageFetch)
        primary_keys = [key.name for key in mapper.primary_key]

        assert "id" in primary_keys
        assert len(primary_keys) == 1

    def test_message_fetch_model_foreign_keys(self):
        """Test that MessageFetch model has correct foreign keys."""
        mapper = inspect(MessageFetch)
        user_id_col = mapper.columns["user_id"]

        # Check foreign key exists
        assert len(user_id_col.foreign_keys) == 1
        fk = list(user_id_col.foreign_keys)[0]
        assert "users.id" in str(fk.target_fullname)

    def test_message_fetch_model_nullable_constraints(self):
        """Test nullable constraints on MessageFetch columns."""
        mapper = inspect(MessageFetch)

        # Required (NOT NULL) columns
        required_cols = ["id", "user_id", "status", "messages_count", "started_at"]

        for col_name in required_cols:
            col = mapper.columns[col_name]
            assert col.nullable is False, f"{col_name} should be NOT NULL"

        # Optional (NULL) columns
        optional_cols = ["completed_at", "error_message"]

        for col_name in optional_cols:
            col = mapper.columns[col_name]
            assert col.nullable is True, f"{col_name} should be NULL"

    def test_message_fetch_model_default_values(self):
        """Test default values for MessageFetch columns."""
        mapper = inspect(MessageFetch)

        messages_count_col = mapper.columns["messages_count"]
        assert messages_count_col.default is not None

    def test_message_fetch_model_has_indexes(self):
        """Test that MessageFetch model has required indexes."""
        indexes = MessageFetch.__table_args__

        index_names = []
        for item in indexes:
            if hasattr(item, "name"):
                index_names.append(item.name)

        assert "idx_fetches_user_started" in index_names

    def test_message_fetch_model_has_relationship_to_user(self):
        """Test that MessageFetch model has relationship to User."""
        mapper = inspect(MessageFetch)
        relationship_names = [rel.key for rel in mapper.relationships]

        assert "user" in relationship_names

    def test_message_fetch_model_repr(self):
        """Test MessageFetch model __repr__ method."""
        fetch = MessageFetch()
        fetch.id = uuid4()
        fetch.user_id = uuid4()
        fetch.status = "completed"
        fetch.messages_count = 150

        repr_str = repr(fetch)

        assert "MessageFetch" in repr_str
        assert str(fetch.id) in repr_str
        assert str(fetch.user_id) in repr_str
        assert "completed" in repr_str
        assert "150" in repr_str


class TestModelRelationships:
    """Test suite for model relationships and cascade behavior."""

    def test_user_messages_relationship_cascade(self):
        """Test that User to Message relationship has cascade delete."""
        mapper = inspect(User)
        messages_rel = mapper.relationships["messages"]

        # Check cascade options
        assert "delete" in messages_rel.cascade or "all" in messages_rel.cascade

    def test_user_message_fetches_relationship_cascade(self):
        """Test that User to MessageFetch relationship has cascade delete."""
        mapper = inspect(User)
        fetches_rel = mapper.relationships["message_fetches"]

        # Check cascade options
        assert "delete" in fetches_rel.cascade or "all" in fetches_rel.cascade

    def test_message_user_relationship_back_populates(self):
        """Test that Message to User relationship is correctly configured."""
        mapper = inspect(Message)
        user_rel = mapper.relationships["user"]

        assert user_rel.back_populates == "messages"

    def test_message_fetch_user_relationship_back_populates(self):
        """Test that MessageFetch to User relationship is correctly configured."""
        mapper = inspect(MessageFetch)
        user_rel = mapper.relationships["user"]

        assert user_rel.back_populates == "message_fetches"
