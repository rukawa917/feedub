"""add unique constraint on messages for dedup

Revision ID: 34aacc0e1ac4
Revises: 9dbeeab677e0
Create Date: 2026-03-15 00:21:07.692457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34aacc0e1ac4'
down_revision: Union[str, Sequence[str], None] = '9dbeeab677e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_message_identity', ['user_id', 'chat_id', 'telegram_message_id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_constraint('uq_message_identity', type_='unique')
