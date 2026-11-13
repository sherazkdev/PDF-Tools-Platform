# PDF Tools API (FastAPI)

Python backend for the PDF Tools Platform. All conversion logic lives here.

## Prerequisites

- Python 3.12+
- Windows, Linux, or macOS for development

## Setup

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
```

## Run

```powershell
python -m pdf_tools_api.main
```

API docs: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/api/v1/health

## Test

```powershell
pytest
```
