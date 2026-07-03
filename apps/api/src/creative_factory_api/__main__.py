"""ASGI entrypoint for uvicorn."""

import uvicorn

from creative_factory_api.config import get_settings
from creative_factory_api.main import create_app

app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "creative_factory_api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
    )
