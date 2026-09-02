"""add_warabandi_fields_to_farm

Revision ID: c73918b910fa
Revises: 899b81212a9a
Create Date: 2026-09-02 15:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c73918b910fa'
down_revision: Union[str, None] = '899b81212a9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('farms', sa.Column('canal_name', sa.String(length=120), server_default='Lower Bari Doab Canal', nullable=True))
    op.add_column('farms', sa.Column('canal_turn_day', sa.String(length=20), server_default='Thursday', nullable=True))
    op.add_column('farms', sa.Column('canal_turn_time', sa.String(length=10), server_default='02:00', nullable=True))
    op.add_column('farms', sa.Column('canal_turn_duration_hours', sa.Float(), server_default='4.0', nullable=True))
    op.add_column('farms', sa.Column('tubewell_power_source', sa.String(length=30), server_default='diesel', nullable=True))
    op.add_column('farms', sa.Column('tubewell_hourly_cost_pkr', sa.Float(), server_default='1400.0', nullable=True))


def downgrade() -> None:
    op.drop_column('farms', 'tubewell_hourly_cost_pkr')
    op.drop_column('farms', 'tubewell_power_source')
    op.drop_column('farms', 'canal_turn_duration_hours')
    op.drop_column('farms', 'canal_turn_time')
    op.drop_column('farms', 'canal_turn_day')
    op.drop_column('farms', 'canal_name')

