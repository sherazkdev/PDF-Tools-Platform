from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pdf_tools_api.api.deps import get_cleanup_service
from pdf_tools_api.api.middleware import install_rate_limit
from pdf_tools_api.api.router import api_router
from pdf_tools_api.core.config import get_settings
from pdf_tools_api.core.exceptions import AppError, app_error_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup = get_cleanup_service()
    cleanup.expire_due_jobs()
    yield
    cleanup.expire_due_jobs()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.2.0",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
        lifespan=lifespan,
    )

    app.add_exception_handler(AppError, app_error_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
    install_rate_limit(app)

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["system"])
    def root_health() -> dict[str, str]:
        return {"status": "ok"}

    return app
