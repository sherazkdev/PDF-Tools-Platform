import uvicorn

from pdf_tools_api.core.app import create_app
from pdf_tools_api.core.config import get_settings

app = create_app()


def run() -> None:
    settings = get_settings()
    uvicorn.run(
        "pdf_tools_api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.app_env == "development",
    )


if __name__ == "__main__":
    run()
