"""Pytest fixtures for AgriTwin backend tests."""

import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Add backend and data-engine to sys.path
backend_dir = Path(__file__).resolve().parent.parent
data_engine_dir = backend_dir.parent / "data-engine"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(data_engine_dir) not in sys.path:
    sys.path.insert(0, str(data_engine_dir))

from app.main import app
from app.database import Base, get_db
from app.models import User, Farm, Crop

# In-memory SQLite engine with StaticPool so tables persist across connections within the test
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables in the in-memory test database once per session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a clean transactional database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Ensure a default test user (id=1) exists for foreign keys
    if not session.query(User).filter_by(id=1).first():
        default_user = User(
            id=1,
            email="farmer.test@agritwin.pk",
            hashed_password="hashed_test_password_placeholder",
            name="Malik Muhammad Akram",
            role="farmer",
        )
        session.add(default_user)
        session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
