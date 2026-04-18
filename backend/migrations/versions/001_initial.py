"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table with IF NOT EXISTS
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('user', 'admin', name='role'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    
    # Create index if not exists using raw SQL
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email 
        ON users (email)
    """)

    # Create conferences table with IF NOT EXISTS
    op.create_table('conferences',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('cfp_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'published', 'cancelled', name='conferencestatus'), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    
    # Create indexes with IF NOT EXISTS using raw SQL
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_conferences_category 
        ON conferences (category)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_conferences_owner_id 
        ON conferences (owner_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_conferences_start_date 
        ON conferences (start_date)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_conferences_status 
        ON conferences (status)
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_conferences_status'), table_name='conferences')
    op.drop_index(op.f('ix_conferences_start_date'), table_name='conferences')
    op.drop_index(op.f('ix_conferences_owner_id'), table_name='conferences')
    op.drop_index(op.f('ix_conferences_category'), table_name='conferences')
    op.drop_table('conferences')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')