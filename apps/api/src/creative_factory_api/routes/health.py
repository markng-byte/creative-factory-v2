"""Health check routes."""

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(request: Request) -> dict[str, str]:
    settings = request.app.state.settings
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


@router.get("/")
def root(request: Request) -> dict[str, str]:
    settings = request.app.state.settings
    return {
        "message": "Creative Factory API scaffold",
        "docs": "/docs",
        "health": "/health",
        "version": settings.app_version,
    }
