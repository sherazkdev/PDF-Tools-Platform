# Conversion engine matrix

Planned engines (not installed until the relevant phase). License and maintenance reviewed before adoption.

| Tool | Planned engine(s) | License notes | Phase |
|------|-------------------|---------------|-------|
| JPG to PDF | Pillow, img2pdf | Permissive | 3 |
| Word to PDF | LibreOffice headless | MPL/LGPL ecosystem | 5 |
| PowerPoint to PDF | LibreOffice headless | Same | 5 |
| Excel to PDF | LibreOffice headless | Same | 5 |
| HTML to PDF | Playwright Chromium | Browser deps; URL gated | 6 |
| PDF to JPG | pypdfium2 / Pillow | Check MuPDF linkage | 4 |
| PDF to Word | TBD (pdf2docx eval.) | Maintenance concern | 7 |
| PDF to PowerPoint | TBD / document gap | May block production | 9 |
| PDF to Excel | pdfplumber + openpyxl | Permissive | 8 |
| PDF to PDF/A | veraPDF + converter TBD | Validator required | 10 |

**AGPL caution:** Avoid MuPDF/Ghostscript-derived stacks in proprietary deployment without legal review.

**System binaries (not yet installed locally):** LibreOffice, veraPDF, Playwright browsers.
