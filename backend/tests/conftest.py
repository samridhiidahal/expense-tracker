import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# A throwaway in-memory database, so tests never touch your real expenses.db
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def login(client):
    """Returns a function that signs a user up, logs them in, and gives auth headers."""

    def _login(email="user1@example.com", password="password123"):
        client.post("/auth/signup", json={"email": email, "password": password})
        response = client.post(
            "/auth/login", data={"username": email, "password": password}
        )
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _login