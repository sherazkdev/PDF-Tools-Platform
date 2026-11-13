export type PageSelectionMode = "all" | "custom";

export type DpiPreset = "72" | "150" | "200" | "300";

export type JpegQualityPreset = "standard" | "high" | "maximum";

export interface PdfToJpgSettings {
  page_mode: PageSelectionMode;
  page_range: string;
  dpi: DpiPreset;
  jpeg_quality: JpegQualityPreset;
}

export const DEFAULT_PDF_SETTINGS: PdfToJpgSettings = {
  page_mode: "all",
  page_range: "",
  dpi: "150",
  jpeg_quality: "high",
};

export const MAX_PDF_BYTES = 52_428_800;

export const DPI_LABELS: Record<DpiPreset, string> = {
  "72": "Standard — 72 DPI",
  "150": "High — 150 DPI",
  "200": "Very High — 200 DPI",
  "300": "Maximum — 300 DPI",
};

export const QUALITY_LABELS: Record<JpegQualityPreset, string> = {
  standard: "Standard",
  high: "High",
  maximum: "Maximum",
};
