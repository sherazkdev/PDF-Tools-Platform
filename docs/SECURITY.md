# Security

## Uploads (Phase 2)

- Max size / file count from settings (`MAX_UPLOAD_BYTES`, `MAX_FILES_PER_JOB`)
- Streaming writes in `UPLOAD_CHUNK_BYTES` chunks (default 256 KiB)
- Extension + magic-byte checks (`security/signatures.py`)
- Sanitized original names; internal random stored names
- Path traversal blocked in `storage/paths.py`

Configure matching limits on the **reverse proxy** (e.g. nginx `client_max_body_size`) and managed host upload caps.

## Job access

- Random `job_id` (32 hex chars) **plus** `X-Job-Access-Token` (URL-safe secret)
- Token hashed at rest; plaintext shown only in create response
- Tokens are not accepted in query strings

## Planned tools

`POST /jobs` with unimplemented converter IDs returns **501** — no job is created and no fake output is produced.

**Live:** `jpg-to-pdf`, `pdf-to-jpg`.

### PDF to JPG limits

- `pdf_max_pages` (default 200), `pdf_max_selected_pages` (50), `pdf_max_render_pixels` (40M per page)
- Encrypted PDFs rejected (`pypdf` metadata; no password guessing)
- PDFium rendered **one page at a time**; avoid concurrent PDFium use across threads in one process

## Test converter

`test-fixture` is registered only when `ENABLE_TEST_CONVERTER=true` or `APP_ENV=test`. Keep disabled in production.

## Abuse controls

- Per-IP POST `/jobs` rate limit (`RATE_LIMIT_JOBS_PER_MINUTE`)
- `MAX_CONCURRENT_JOBS` in-process cap
- Future: Redis-backed limits, CAPTCHA, object-storage quotas

## Logging

No file contents in logs. Error responses use stable codes/messages only.

## HTML URL conversion

Still disabled until SSRF design is implemented (Phase 6).
