"""add check constraint on item cost

Revision ID: 00e84c8ea077
Revises: f1711e63909f
Create Date: 2026-04-15 18:27:40.059261

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '00e84c8ea077'
down_revision = 'f1711e63909f'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('item', schema=None) as batch_op:
        batch_op.create_check_constraint('check_item_cost_positive', 'cost >= 0')


def downgrade():
    with op.batch_alter_table('item', schema=None) as batch_op:
        batch_op.drop_constraint('check_item_cost_positive', type_='check')
