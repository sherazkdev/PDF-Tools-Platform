import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from pdf_tools_api.core.config import get_settings
from pdf_tools_api.schemas.errors import ErrorDetail, ErrorResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int) -> None:
        super().__init__(app)
        self._limit = limit_per_minute
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path.rstrip("/").endswith("/jobs"):
            client = request.client.host if request.client else "unknown"
            now = time.time()
            bucket = self._hits[client]
            while bucket and now - bucket[0] > 60:
                bucket.popleft()
            if len(bucket) >= self._limit:
                body = ErrorResponse(
                    error=ErrorDetail(
                        code="rate_limited",
                        message="Too many job requests. Slow down and retry.",
                    )
                )
                return JSONResponse(status_code=429, content=body.model_dump())
            bucket.append(now)
        return await call_next(request)


def install_rate_limit(app) -> None:
    settings = get_settings()
    app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_jobs_per_minute)
