# Deployment (draft)

No production provisioning without explicit approval.

## Target topology

- Managed Next.js (e.g. Vercel-compatible host) → `apps/web`
- Managed Python service → `apps/api` (uvicorn/gunicorn)
- Background workers → same image, Redis queue (ARQ/RQ/Celery TBD)
- Private object storage for job I/O
- Redis for queue and rate-limit state

## Artifacts to add (Phase 14)

- Dockerfile for API + worker
- Environment variable documentation
- Health check endpoints for load balancers (`/api/v1/health`, `/health`)
