"""FastAPI application factory (scaffold only)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from creative_factory_api.config import Settings, get_settings
from creative_factory_api.routes import health_router


def create_app(settings: Settings | None = None) -> FastAPI:
    cfg = settings or get_settings()

    app = FastAPI(
        title=cfg.app_name,
        version=cfg.app_version,
        debug=cfg.debug,
    )
    app.state.settings = cfg

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)

    return app


app = create_app()
