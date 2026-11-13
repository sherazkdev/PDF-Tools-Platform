# Implementation status

Last updated: Phase 3 complete

## JPG to PDF

| Gate | Status |
|------|--------|
| Engine (img2pdf + Pillow) | **Functional** |
| API integration | **Complete** |
| Frontend E2E | **1 Playwright test passed** |
| Backend tests | **18 pytest passed** |
| SEO landing | **Complete** (`NEXT_PUBLIC_SITE_INDEX` gate) |
| Production ready | **Ready for managed deploy** (inline worker limits remain) |

## Converters

| Tool | Functional | Quality verified | Production ready |
|------|------------|------------------|------------------|
| **JPG to PDF** | ✓ | ✓ (pypdf + integration) | ✓ (with documented limits) |
| Word to PDF | | | |
| PowerPoint to PDF | | | |
| Excel to PDF | | | |
| HTML to PDF | | | |
| PDF to JPG | | | |
| PDF to Word | | | |
| PDF to PowerPoint | | | |
| PDF to Excel | | | |
| PDF to PDF/A | | | |

## Test evidence (Phase 3)

| Check | Result |
|-------|--------|
| `pytest` | **18 passed** |
| `ruff check` | **Clean** |
| `npm run lint` | Pass |
| `npm run build` | Pass (18 routes) |
| `vitest` | **3 passed** |
| Playwright E2E | **1 passed** |
| Manual 3×JPG script | **3 pages PDF** |

## npm audit (unresolved)

See `docs/TESTING.md` — minimatch (eslint toolchain, dev), postcss via Next (high; fix requires Next 16 without approval). No `audit fix --force` applied.

## Next

Phase 4 — **PDF to JPG**
