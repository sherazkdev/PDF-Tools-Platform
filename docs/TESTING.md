# Testing

## Backend

```powershell
cd apps\api
.\.venv\Scripts\Activate.ps1
pytest
ruff check pdf_tools_api tests
```

Coverage highlights:

- Registry (planned vs `test-fixture`)
- Job create → complete → download (`test-fixture`)
- 501 for planned converters
- Empty/mismatched uploads
- Token auth (401/403)
- Failed/expired download rules

## Frontend

```powershell
cd apps\web
npm run lint
npx tsc --noEmit
npm run build
npm audit
```

E2E Playwright: Phase 3+ after first live converter.
