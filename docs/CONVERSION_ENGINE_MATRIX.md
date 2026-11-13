# Conversion engine matrix

| Tool | Engine | Version (local) | License | Status |
|------|--------|-------------------|---------|--------|
| **JPG to PDF** | img2pdf (+ PikePDF dep), Pillow validation, pypdf verify | img2pdf 0.5.1, Pillow 11.3.0, pypdf 6.21.4 | LGPL/MIT-style stack — review PikePDF for deploy | **Quality verified** |
| Word to PDF | LibreOffice (planned) | — | — | Planned |
| **PDF to JPG** | pypdfium2 (PDFium), Pillow JPEG encode, pypdf encrypt check | pypdfium2 4.30.0, Pillow 11.3.0, pypdf 6.21.4 | Apache-2.0 (pypdfium2); PDFium BSD-style — verify bundle for deploy | **Quality verified** |
| … | | | | |

### JPG to PDF notes

- **Fit mode:** native JPEG embed via img2pdf when no EXIF rewrite required.
- **A4/Letter:** `FitMode.into` + margin borders in PDF points (18/36/72 pt).
- **EXIF:** `ImageOps.exif_transpose`; re-save at quality 95 when rotation/non-RGB.
- **Not claimed:** bit-perfect lossless for every file.
