"""Health endpoint tests."""

from fastapi.testclient import TestClient

from creative_factory_api.config import Settings
from creative_factory_api.main import create_app


def test_health_check_returns_ok() -> None:
    settings = Settings(
        APP_NAME="Test API",
        APP_VERSION="0.0.0-test",
        ENVIRONMENT="test",
    )
    client = TestClient(create_app(settings))

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Test API"
    assert payload["version"] == "0.0.0-test"


def test_root_returns_scaffold_message() -> None:
    client = TestClient(create_app(Settings(ENVIRONMENT="test")))

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Creative Factory API scaffold"
