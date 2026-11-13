export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";
export type MarginSize = "none" | "small" | "medium" | "large";

export interface JpgConversionSettings {
  page_size: PageSize;
  orientation: Orientation;
  margins: MarginSize;
}

export interface LocalJpgFile {
  id: string;
  file: File;
  previewUrl: string;
}

export const DEFAULT_SETTINGS: JpgConversionSettings = {
  page_size: "a4",
  orientation: "auto",
  margins: "small",
};

export const MAX_JPG_BYTES = 52_428_800;
export const MAX_JPG_FILES = 50;
