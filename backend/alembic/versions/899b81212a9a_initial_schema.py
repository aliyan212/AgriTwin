"""initial_schema

Revision ID: 899b81212a9a
Revises: 
Create Date: 2026-09-02 03:10:26.483800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '899b81212a9a'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="farmer", nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)

    # Farms table
    op.create_table(
        "farms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("geometry_geojson", sa.Text(), nullable=True),
        sa.Column("area_acres", sa.Float(), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("province", sa.String(length=100), server_default="Punjab", nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_farms_id"), "farms", ["id"], unique=False)

    # Crops table
    op.create_table(
        "crops",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("crop_name", sa.String(length=100), nullable=False),
        sa.Column("variety", sa.String(length=100), nullable=True),
        sa.Column("sowing_date", sa.DateTime(), nullable=True),
        sa.Column("expected_harvest_date", sa.DateTime(), nullable=True),
        sa.Column("growth_stage", sa.String(length=50), nullable=True),
        sa.Column("season", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_crops_id"), "crops", ["id"], unique=False)

    # Weather records table
    op.create_table(
        "weather_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("temperature_c", sa.Float(), nullable=True),
        sa.Column("humidity_pct", sa.Float(), nullable=True),
        sa.Column("rainfall_mm", sa.Float(), nullable=True),
        sa.Column("wind_speed_kmh", sa.Float(), nullable=True),
        sa.Column("et0_mm", sa.Float(), nullable=True),
        sa.Column("cloud_cover_pct", sa.Float(), nullable=True),
        sa.Column("source", sa.String(length=50), server_default="open-meteo", nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_weather_records_id"), "weather_records", ["id"], unique=False)

    # Satellite observations table
    op.create_table(
        "satellite_observations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("ndvi", sa.Float(), nullable=True),
        sa.Column("evi", sa.Float(), nullable=True),
        sa.Column("cloud_cover_pct", sa.Float(), nullable=True),
        sa.Column("source", sa.String(length=50), server_default="sentinel-2", nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_satellite_observations_id"), "satellite_observations", ["id"], unique=False)

    # Soil observations table
    op.create_table(
        "soil_observations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("soil_moisture_m3m3", sa.Float(), nullable=True),
        sa.Column("soil_temperature_c", sa.Float(), nullable=True),
        sa.Column("depth_cm", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=50), server_default="era5-land", nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_soil_observations_id"), "soil_observations", ["id"], unique=False)

    # Recommendations table
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("recommendation_text", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("risk_level", sa.String(length=20), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendations_id"), "recommendations", ["id"], unique=False)

    # Health score snapshots table
    op.create_table(
        "health_score_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("overall", sa.Integer(), nullable=False),
        sa.Column("vegetation", sa.Integer(), nullable=True),
        sa.Column("water", sa.Integer(), nullable=True),
        sa.Column("weather", sa.Integer(), nullable=True),
        sa.Column("pest_risk", sa.Integer(), nullable=True),
        sa.Column("climate", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_health_score_snapshots_id"), "health_score_snapshots", ["id"], unique=False)

    # Alerts table
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farm_id", sa.Integer(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["farm_id"], ["farms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alerts_id"), "alerts", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_alerts_id"), table_name="alerts")
    op.drop_table("alerts")
    op.drop_index(op.f("ix_health_score_snapshots_id"), table_name="health_score_snapshots")
    op.drop_table("health_score_snapshots")
    op.drop_index(op.f("ix_recommendations_id"), table_name="recommendations")
    op.drop_table("recommendations")
    op.drop_index(op.f("ix_soil_observations_id"), table_name="soil_observations")
    op.drop_table("soil_observations")
    op.drop_index(op.f("ix_satellite_observations_id"), table_name="satellite_observations")
    op.drop_table("satellite_observations")
    op.drop_index(op.f("ix_weather_records_id"), table_name="weather_records")
    op.drop_table("weather_records")
    op.drop_index(op.f("ix_crops_id"), table_name="crops")
    op.drop_table("crops")
    op.drop_index(op.f("ix_farms_id"), table_name="farms")
    op.drop_table("farms")
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
