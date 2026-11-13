from fastapi import APIRouter

from pdf_tools_api.api.routes import health, jobs, pdf_inspect

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(jobs.router)
api_router.include_router(pdf_inspect.router)
