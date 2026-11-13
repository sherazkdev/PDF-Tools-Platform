# SEO strategy

## Principles

- Server-rendered content for all indexable tool pages
- Unique title, meta description, H1 per tool (`src/lib/tools.ts`)
- Canonical URLs via `metadataBase` and per-page `alternates.canonical`
- Sitemap lists **only** `indexable: true` tools (currently homepage only)
- Unreleased tools: `robots: noindex` on tool pages, honest "Coming soon" messaging

## URL map

Permanent slugs: `/jpg-to-pdf`, `/word-to-pdf`, … `/pdf-to-pdfa` (see tools config).

## Pre-launch checklist (Phase 12)

- [ ] Rendered HTML audit per tool
- [ ] Sitemap includes only live tools
- [ ] Core Web Vitals measurement
- [ ] Internal linking audit
- [ ] Structured data only where eligible (e.g. FAQ when content is stable)

## Keyword research worksheet

| Tool slug | Primary intent (draft) | Country validation | Notes |
|-----------|------------------------|--------------------|-------|
| jpg-to-pdf | jpg to pdf | pending | |
| word-to-pdf | word to pdf | pending | |
| … | | pending | Fill after Search Console data |

Do not publish search volume estimates without measured data.
