"""Tests for the ASGI entrypoint module."""

import importlib


def test_main_module_exposes_app() -> None:
    module = importlib.import_module("creative_factory_api.__main__")
    assert module.app is not None
    assert hasattr(module.app, "router")
