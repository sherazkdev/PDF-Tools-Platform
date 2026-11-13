export type ToolReleaseStatus = "live" | "upcoming";

export type ToolCategory = "to-pdf" | "from-pdf";

export interface ToolDefinition {
  slug: string;
  name: string;
  category: ToolCategory;
  searchIntent: string;
  title: string;
  metaDescription: string;
  h1: string;
  shortDescription: string;
  supportedFormats: string[];
  benefits: string[];
  limitations: string[];
  relatedTools: string[];
  indexable: boolean;
  releaseStatus: ToolReleaseStatus;
}

const related = (slugs: string[]) => slugs;

export const tools: ToolDefinition[] = [
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "to-pdf",
    searchIntent: "Convert JPEG images to a single PDF",
    title: "JPG to PDF Converter – Convert Images Online | ForgePDF",
    metaDescription:
      "Convert JPG images to PDF online. Upload multiple photos, arrange their order, choose page settings and download your PDF.",
    h1: "JPG to PDF Converter",
    shortDescription:
      "Turn one or more JPEG images into a polished PDF with layout controls.",
    supportedFormats: ["JPG", "JPEG"],
    benefits: [
      "Combine multiple images in order",
      "Portrait or landscape page layout",
      "Configurable margins on A4 and Letter",
    ],
    limitations: [
      "Not a scan/OCR tool—images are placed as pages, not re-typeset as text.",
      "Fit-to-image mode does not add printable margins; use A4 or Letter for margins.",
      "Re-encoding after EXIF rotation may slightly change quality; direct JPEG embed is used when possible.",
    ],
    relatedTools: related(["pdf-to-jpg", "word-to-pdf", "html-to-pdf"]),
    indexable: true,
    releaseStatus: "live",
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    category: "to-pdf",
    searchIntent: "Convert Word DOCX documents to PDF",
    title: "Word to PDF Converter | ForgePDF",
    metaDescription:
      "Convert DOCX Word documents to PDF while preserving text, images, and tables where the engine allows.",
    h1: "Word to PDF Converter",
    shortDescription: "Export Word documents to shareable, print-ready PDFs.",
    supportedFormats: ["DOCX", "DOC (when supported)"],
    benefits: [
      "Preserves document structure where possible",
      "Multi-page documents supported",
      "Download the generated PDF directly",
    ],
    limitations: [
      "Complex Word features (macros, certain fonts) may not transfer perfectly.",
      "Legacy .doc support depends on the installed conversion engine.",
    ],
    relatedTools: related(["pdf-to-word", "powerpoint-to-pdf", "excel-to-pdf"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    category: "to-pdf",
    searchIntent: "Convert PowerPoint presentations to PDF",
    title: "PowerPoint to PDF Converter | ForgePDF",
    metaDescription:
      "Convert PPTX slides to PDF pages for easy sharing and printing.",
    h1: "PowerPoint to PDF Converter",
    shortDescription: "Turn slide decks into PDF documents one page per slide.",
    supportedFormats: ["PPTX", "PPT (when supported)"],
    benefits: ["Maintains slide order", "Handles standard and wide layouts"],
    limitations: ["Custom fonts may be substituted if unavailable on the server."],
    relatedTools: related(["pdf-to-powerpoint", "word-to-pdf", "jpg-to-pdf"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    category: "to-pdf",
    searchIntent: "Convert Excel spreadsheets to PDF",
    title: "Excel to PDF Converter | ForgePDF",
    metaDescription:
      "Convert XLSX workbooks to PDF with worksheet and print-area awareness where available.",
    h1: "Excel to PDF Converter",
    shortDescription: "Publish spreadsheets as PDFs for reports and archiving.",
    supportedFormats: ["XLSX", "XLS (when supported)"],
    benefits: ["Multiple worksheets", "Respects print areas when defined"],
    limitations: [
      "Wide sheets may split across pages; preview before sharing critical reports.",
    ],
    relatedTools: related(["pdf-to-excel", "word-to-pdf", "pdf-to-pdfa"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    category: "to-pdf",
    searchIntent: "Convert HTML files to PDF",
    title: "HTML to PDF Converter | ForgePDF",
    metaDescription:
      "Render uploaded HTML (and CSS where supported) into paginated PDF files.",
    h1: "HTML to PDF Converter",
    shortDescription: "Create PDFs from HTML files with page size and margin controls.",
    supportedFormats: ["HTML", "HTM"],
    benefits: ["Modern CSS rendering via controlled browser engine", "Page orientation options"],
    limitations: [
      "URL-to-PDF will remain disabled until SSRF protections are verified.",
      "Advanced web apps with heavy JavaScript may not render identically to a live browser tab.",
    ],
    relatedTools: related(["jpg-to-pdf", "word-to-pdf", "pdf-to-jpg"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "from-pdf",
    searchIntent: "Convert PDF pages to JPG images",
    title: "PDF to JPG Converter | ForgePDF",
    metaDescription:
      "Extract PDF pages as JPG images. Choose a page range and download a single image or a ZIP archive.",
    h1: "PDF to JPG Converter",
    shortDescription: "Rasterize PDF pages to JPEG with quality controls.",
    supportedFormats: ["PDF"],
    benefits: ["Page range selection", "ZIP download for multiple pages"],
    limitations: ["Text is rendered as pixels—not editable after export."],
    relatedTools: related(["jpg-to-pdf", "pdf-to-word", "pdf-to-excel"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    category: "from-pdf",
    searchIntent: "Convert PDF to editable Word DOCX",
    title: "PDF to Word Converter | ForgePDF",
    metaDescription:
      "Turn PDFs into DOCX files with editable text where extraction is reliable.",
    h1: "PDF to Word Converter",
    shortDescription: "Recover editable text and basic structure from PDF documents.",
    supportedFormats: ["PDF → DOCX"],
    benefits: ["Editable output when text layers exist", "Tables and images where extractable"],
    limitations: [
      "Scanned PDFs require OCR; this tool does not claim OCR until explicitly implemented.",
      "Layout fidelity varies by document complexity.",
    ],
    relatedTools: related(["word-to-pdf", "pdf-to-excel", "pdf-to-powerpoint"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    category: "from-pdf",
    searchIntent: "Convert PDF to PowerPoint PPTX",
    title: "PDF to PowerPoint Converter | ForgePDF",
    metaDescription:
      "Convert PDF slides to PowerPoint only when editable reconstruction is verified—not image-only placeholders.",
    h1: "PDF to PowerPoint Converter",
    shortDescription: "Rebuild presentations when the engine can recover real slide objects.",
    supportedFormats: ["PDF → PPTX"],
    benefits: ["Slide-per-page workflow when quality benchmarks pass"],
    limitations: [
      "Editable conversion is engine-dependent; image-only slides are not marketed as fully editable.",
      "May remain upcoming until a license-compatible engine meets fidelity requirements.",
    ],
    relatedTools: related(["powerpoint-to-pdf", "pdf-to-jpg", "pdf-to-word"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    category: "from-pdf",
    searchIntent: "Extract PDF tables to Excel XLSX",
    title: "PDF to Excel Converter | ForgePDF",
    metaDescription:
      "Extract tables from PDFs into XLSX spreadsheets with integrity checks when extraction is uncertain.",
    h1: "PDF to Excel Converter",
    shortDescription: "Pull tabular data into Excel when structure is detectable.",
    supportedFormats: ["PDF → XLSX"],
    benefits: ["Multiple tables and worksheets when found", "Flags poor extractions"],
    limitations: [
      "Scanned tables without text layers may fail or require OCR (not yet offered).",
      "Merged cells and nested layouts may need manual cleanup.",
    ],
    relatedTools: related(["excel-to-pdf", "pdf-to-word", "pdf-to-pdfa"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
  {
    slug: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    category: "from-pdf",
    searchIntent: "Convert PDF to archival PDF/A",
    title: "PDF to PDF/A Converter | ForgePDF",
    metaDescription:
      "Create standards-compliant PDF/A files validated with an external conformance checker.",
    h1: "PDF to PDF/A Converter",
    shortDescription: "Produce archival PDF/A output with documented conformance profile.",
    supportedFormats: ["PDF → PDF/A"],
    benefits: ["External validation step", "Clear failure reporting"],
    limitations: [
      "Some interactive or embedded content may be removed to meet the profile.",
      "Requires veraPDF or equivalent validator in the deployment environment.",
    ],
    relatedTools: related(["word-to-pdf", "excel-to-pdf", "pdf-to-word"]),
    indexable: false,
    releaseStatus: "upcoming",
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((t) => t.slug === slug);
}

export const toolsByCategory = {
  "to-pdf": tools.filter((t) => t.category === "to-pdf"),
  "from-pdf": tools.filter((t) => t.category === "from-pdf"),
};
