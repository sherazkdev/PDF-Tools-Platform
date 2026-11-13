# Implementation status

Last updated: Phase 4 complete

## Live converters

| Tool | Engine | API | Frontend | Backend tests | E2E |
|------|--------|-----|----------|---------------|-----|
| **JPG to PDF** | img2pdf + Pillow | ✓ | `/jpg-to-pdf` | ✓ | ✓ |
| **PDF to JPG** | pypdfium2 4.30 + Pillow | ✓ | `/pdf-to-jpg` | ✓ | ✓ |

## PDF to JPG (Phase 4)

| Gate | Status |
|------|--------|
| Engine (pypdfium2 + Pillow) | **Functional** |
| Page range / DPI / quality | **Complete** |
| JPG single / ZIP multi | **Verified** |
| Inspect endpoint (page count) | **Complete** |
| SEO landing | **Complete** (`NEXT_PUBLIC_SITE_INDEX` gate) |
| Production ready | **Ready for managed deploy** (inline worker; PDFium not thread-safe—one render at a time per process) |

## Remaining tools

Word/PowerPoint/Excel/HTML to PDF and PDF to Office/PDF/A remain **planned** (501).

## Test evidence (Phase 4 run)

| Check | Result |
|-------|--------|
| `pytest` | **24 passed** |
| `ruff check` | **Clean** |
| `npm run lint` | Pass |
| `npm run build` | Pass (17 routes incl. `/pdf-to-jpg`) |
| `vitest` | **4 passed** |
| Playwright E2E | **pdf-to-jpg ZIP (2 JPGs)** + jpg-to-pdf regression |

## npm audit (unresolved)

See `docs/TESTING.md` — no `audit fix --force`. PostCSS/minimatch advisories unchanged; evaluate before public launch.

## Next

Phase 5 — Office → PDF (not started)
