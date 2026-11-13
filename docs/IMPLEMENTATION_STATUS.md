# Implementation status

Last updated: Phase 2 complete

## Platform

| Item | Status |
|------|--------|
| Next.js **15.5.29** (security patch) | Done |
| FastAPI job API | Done |
| Converter registry (10 planned + test fixture) | Done |
| SQLite job store (`var/storage/_meta/jobs.db`) | Done |
| Per-job storage + cleanup | Done |
| Job access tokens (header) | Done |
| Frontend `jobs-api.ts` client | Done |
| Tool pages still noindex / upcoming | Done |

## Phase 2 acceptance

| Criterion | Status |
|-----------|--------|
| POST/GET/download job routes | Done |
| No fake conversions for planned tools | Done (501) |
| `test-fixture` converter for integration tests | Done |
| pytest coverage for uploads, auth, lifecycle | Done (**13** tests) |

## Converters

| Tool | Planned | In progress | Functional | Quality verified | Production ready |
|------|---------|-------------|------------|------------------|------------------|
| JPG to PDF | ✓ | | | | |
| Word to PDF | ✓ | | | | |
| PowerPoint to PDF | ✓ | | | | |
| Excel to PDF | ✓ | | | | |
| HTML to PDF | ✓ | | | | |
| PDF to JPG | ✓ | | | | |
| PDF to Word | ✓ | | | | |
| PDF to PowerPoint | ✓ | | | | |
| PDF to Excel | ✓ | | | | |
| PDF to PDF/A | ✓ | | | | |

## Test evidence

| Check | Result |
|-------|--------|
| `pytest` | 13 passed |
| `ruff check` | Clean (after fixes) |
| `npm run lint` | Pass |
| `npm run build` | Pass (17 routes) |
| `npm audit` | 8 issues (see README / handoff) |

## Ready for Phase 3

**Yes** — wire JPG-to-PDF converter into registry and enable frontend upload on `/jpg-to-pdf`.
