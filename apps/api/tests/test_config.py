"""Tests for application configuration."""

from creative_factory_api.config import Settings, get_settings


def test_get_settings_is_cached() -> None:
    assert get_settings() is get_settings()


def test_is_development_default_true() -> None:
    assert Settings().is_development is True


def test_is_development_false(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    get_settings.cache_clear()
    try:
        assert get_settings().is_development is False
    finally:
        get_settings.cache_clear()


def test_parse_cors_origins_list_passthrough() -> None:
    assert Settings.parse_cors_origins(["https://a.example", "https://b.example"]) == [
        "https://a.example",
        "https://b.example",
    ]


def test_parse_cors_origins_json_string() -> None:
    assert Settings.parse_cors_origins('["https://a.example", "https://b.example"]') == [
        "https://a.example",
        "https://b.example",
    ]


def test_parse_cors_origins_comma_string() -> None:
    assert Settings.parse_cors_origins("https://a.example, https://b.example ,") == [
        "https://a.example",
        "https://b.example",
    ]


def test_parse_cors_origins_non_string_fallback() -> None:
    assert Settings.parse_cors_origins(123) == ["http://localhost:3000"]


def test_cors_origins_from_env_json(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", '["https://c.example"]')
    get_settings.cache_clear()
    try:
        assert get_settings().cors_origins == ["https://c.example"]
    finally:
        get_settings.cache_clear()
