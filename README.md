# PDF Tools Platform (ForgePDF)

Monorepo for an SEO-first PDF conversion platform: **Next.js** frontend (`apps/web`) and **FastAPI** backend (`apps/api`).

## Stack versions (Phase 1)

| Component | Version |
|-----------|---------|
| Node.js | 26.x (local) |
| Next.js | 15.1.0 |
| React | 19.x |
| Python | 3.12.10 |
| FastAPI | 0.115+ |

## Quick start

### Backend

```powershell
cd E:\PDF-Tools-Platform\apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
python -m pdf_tools_api.main
```

Health: http://127.0.0.1:8000/api/v1/health

### Frontend

```powershell
cd E:\PDF-Tools-Platform\apps\web
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000 — the homepage includes a live API connectivity check.

### Verify

```powershell
# API tests
cd apps\api && .\.venv\Scripts\Activate.ps1 && pytest

# Web quality gates
cd apps\web && npm run lint && npx tsc --noEmit && npm run build
```

## Repository layout

- `apps/web` — Next.js App Router UI, SEO, tool pages
- `apps/api` — FastAPI conversion API (all business logic)
- `docs/` — Architecture, security, SEO, testing, deployment
- `infrastructure/` — Future hosting and worker configuration
- `tests/fixtures/` — Conversion test documents (Phase 2+)

## Documentation

See `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_STATUS.md` for current progress.
