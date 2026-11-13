# Architecture

## Overview

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Web | Next.js 15.5 App Router | SEO UI, future upload UX |
| API | FastAPI 0.162+ | Jobs, validation, conversions |
| Job store | SQLite (local) | Durable job metadata |
| File store | `var/storage/{job_id}/` | Inputs/outputs per job |

Production target: Redis queue + shared object storage + workers (same converter interfaces).

## Phase 2 job flow

```
POST /api/v1/jobs (multipart)
  → validate converter (501 if planned only)
  → stream uploads to var/storage/{id}/input/
  → create job (queued) in SQLite
  → process synchronously in API process (dev)
  → completed | failed
GET /api/v1/jobs/{id}  (+ X-Job-Access-Token)
GET /api/v1/jobs/{id}/download  (+ token, completed only)
```

Access tokens are returned **once** at job creation. They are stored as SHA-256 hashes only.

## Modules (`apps/api/pdf_tools_api`)

| Module | Role |
|--------|------|
| `converters/` | `BaseConverter`, registry, `test-fixture` |
| `jobs/` | States, SQLite store, models |
| `storage/` | Paths, per-job dirs, cleanup |
| `security/` | Signatures, filenames, token hashing |
| `services/` | `UploadService`, `JobService` |
| `api/routes/jobs.py` | HTTP surface |

## Frontend

- `src/lib/jobs-api.ts` — typed client (no UI wired yet)
- Tool pages remain disabled upload UI until Phase 3

## Local limitations (explicit)

- Jobs processed inline in the API worker process (not Redis-backed yet).
- SQLite job DB is not shared across multiple API instances.
- Rate limit is in-memory per process.
