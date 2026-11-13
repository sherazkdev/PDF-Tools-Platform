"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_PDF_SETTINGS,
  DPI_LABELS,
  MAX_PDF_BYTES,
  QUALITY_LABELS,
  type PdfToJpgSettings,
} from "@/components/pdf-to-jpg/types";
import { estimateSelectedPageCount } from "@/components/pdf-to-jpg/page-range";
import {
  JobsApiError,
  createJob,
  downloadJobOutput,
  inspectPdfForJpg,
} from "@/lib/jobs-api";

type UiState = "empty" | "ready" | "converting" | "done" | "error";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "pdf" || file.type === "application/pdf";
}

export function PdfToJpgConverter() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [encrypted, setEncrypted] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [settings, setSettings] = useState<PdfToJpgSettings>(DEFAULT_PDF_SETTINGS);
  const [uiState, setUiState] = useState<UiState>("empty");
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("forgepdf-output.jpg");
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }
    };
  }, []);

  const clearDownload = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setDownloadUrl(null);
  }, []);

  const resetForNewFile = () => {
    clearDownload();
    setMessage(null);
    setDownloadName("forgepdf-output.jpg");
  };

  const inspectFile = async (file: File) => {
    setInspecting(true);
    setPageCount(null);
    setEncrypted(false);
    try {
      const info = await inspectPdfForJpg(file);
      if (info.encrypted) {
        setEncrypted(true);
        setPageCount(null);
        setUiState("ready");
        setMessage("This PDF is password-protected. Encrypted files are not supported yet.");
        return;
      }
      setPageCount(info.page_count);
      setEncrypted(false);
      setUiState("ready");
    } catch (err) {
      setPdfFile(null);
      setUiState("empty");
      setMessage(
        err instanceof JobsApiError ? err.message : "Could not read this PDF. Try another file.",
      );
    } finally {
      setInspecting(false);
    }
  };

  const setFile = (file: File) => {
    resetForNewFile();
    if (!isPdf(file)) {
      setMessage("Upload a PDF file.");
      return;
    }
    if (file.size === 0) {
      setMessage("The file is empty.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setMessage("This file exceeds the upload size limit.");
      return;
    }
    setPdfFile(file);
    void inspectFile(file);
  };

  const removeFile = () => {
    resetForNewFile();
    setPdfFile(null);
    setPageCount(null);
    setEncrypted(false);
    setSettings(DEFAULT_PDF_SETTINGS);
    setUiState("empty");
    setMessage(null);
  };

  const rangeValidation =
    pageCount != null && settings.page_mode === "custom"
      ? estimateSelectedPageCount(settings.page_range, pageCount)
      : null;

  const selectedCount =
    pageCount == null
      ? null
      : settings.page_mode === "all"
        ? pageCount
        : rangeValidation?.ok
          ? rangeValidation.count
          : null;

  const outputKind =
    selectedCount === null ? null : selectedCount === 1 ? "JPG" : selectedCount > 1 ? "ZIP" : null;

  const canConvert =
    pdfFile &&
    !inspecting &&
    !encrypted &&
    pageCount != null &&
    uiState !== "converting" &&
    (settings.page_mode === "all" ||
      (rangeValidation?.ok === true && (rangeValidation.count ?? 0) > 0));

  const convert = async () => {
    if (!pdfFile || !canConvert) return;
    if (settings.page_mode === "custom" && rangeValidation && !rangeValidation.ok) {
      setMessage(rangeValidation.message);
      return;
    }
    setUiState("converting");
    setMessage(null);
    clearDownload();
    try {
      const result = await createJob("pdf-to-jpg", [pdfFile], {
        settings: settings as unknown as Record<string, unknown>,
      });
      if (result.status === "failed") {
        throw new JobsApiError("Conversion failed. Check settings and try again.", "conversion_failed");
      }
      if (result.status !== "completed") {
        throw new JobsApiError(`Job status: ${result.status}.`, "job_not_ready");
      }
      sessionStorage.setItem(`forgepdf:job:${result.job_id}`, result.access_token);
      const blob = await downloadJobOutput(result.job_id, result.access_token);
      const isZip = blob.type.includes("zip") || selectedCount !== 1;
      setDownloadName(isZip ? "document-pages.zip" : "document-page.jpg");
      setDownloadUrl(URL.createObjectURL(blob));
      setUiState("done");
    } catch (err) {
      setUiState("error");
      setMessage(err instanceof JobsApiError ? err.message : "Conversion failed. Try again.");
    }
  };

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="pdf-jpg-converter-heading"
    >
      <h2 id="pdf-jpg-converter-heading" className="sr-only">
        PDF to JPG converter
      </h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) setFile(file);
        }}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? "border-brand-400 bg-brand-50" : "border-slate-300 bg-slate-50/80"
        }`}
      >
        <p className="text-base font-medium text-slate-800">Drag a PDF here</p>
        <p className="mt-1 text-sm text-slate-500">or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Select PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <p className="mt-4 text-sm text-amber-900" role="alert">
          {message}
        </p>
      )}

      {pdfFile && (
        <div className="mt-6 flex items-start gap-4 rounded-lg border border-slate-200 p-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-800"
            aria-hidden
          >
            PDF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{pdfFile.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(pdfFile.size)}</p>
            {inspecting && (
              <p className="mt-1 text-xs text-slate-600" role="status">
                Reading page count…
              </p>
            )}
            {!inspecting && pageCount != null && (
              <p className="mt-1 text-xs text-slate-600">{pageCount} pages detected</p>
            )}
            {selectedCount != null && outputKind && (
              <p className="mt-1 text-xs text-slate-600">
                {selectedCount} page{selectedCount === 1 ? "" : "s"} → {outputKind} download
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
          >
            Remove
          </button>
        </div>
      )}

      {pageCount != null && !encrypted && (
        <fieldset className="mt-8 space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Pages</legend>
          <div className="flex flex-wrap gap-4 text-sm text-slate-800">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="page_mode"
                checked={settings.page_mode === "all"}
                onChange={() =>
                  setSettings((s) => ({ ...s, page_mode: "all", page_range: "" }))
                }
              />
              All pages
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="page_mode"
                checked={settings.page_mode === "custom"}
                onChange={() => setSettings((s) => ({ ...s, page_mode: "custom" }))}
              />
              Custom pages
            </label>
          </div>
          {settings.page_mode === "custom" && (
            <label className="block text-sm text-slate-700">
              Page range
              <input
                type="text"
                placeholder="e.g. 1-3, 5, 8"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={settings.page_range}
                onChange={(e) => setSettings((s) => ({ ...s, page_range: e.target.value }))}
                aria-invalid={rangeValidation != null && !rangeValidation.ok}
              />
              {rangeValidation && !rangeValidation.ok && settings.page_range.trim() && (
                <span className="mt-1 block text-xs text-red-700">{rangeValidation.message}</span>
              )}
            </label>
          )}
        </fieldset>
      )}

      {pageCount != null && !encrypted && (
        <fieldset className="mt-8 grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold text-slate-900">
            Output settings
          </legend>
          <label className="text-sm text-slate-700">
            Resolution
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={settings.dpi}
              onChange={(e) =>
                setSettings((s) => ({ ...s, dpi: e.target.value as PdfToJpgSettings["dpi"] }))
              }
            >
              {(Object.keys(DPI_LABELS) as PdfToJpgSettings["dpi"][]).map((key) => (
                <option key={key} value={key}>
                  {DPI_LABELS[key]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Higher DPI increases image dimensions and file size.
            </span>
          </label>
          <label className="text-sm text-slate-700">
            JPEG quality
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={settings.jpeg_quality}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  jpeg_quality: e.target.value as PdfToJpgSettings["jpeg_quality"],
                }))
              }
            >
              {(Object.keys(QUALITY_LABELS) as PdfToJpgSettings["jpeg_quality"][]).map(
                (key) => (
                  <option key={key} value={key}>
                    {QUALITY_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </label>
        </fieldset>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canConvert}
          onClick={() => void convert()}
          className="inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uiState === "converting" ? "Converting…" : "Convert to JPG"}
        </button>
        {pdfFile && (
          <button
            type="button"
            onClick={removeFile}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Convert another PDF
          </button>
        )}
        {uiState === "done" && downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          >
            Download {outputKind ?? "file"}
          </a>
        )}
      </div>

      {uiState === "converting" && (
        <p className="mt-4 text-sm text-slate-600" role="status">
          Uploading and rasterizing pages…
        </p>
      )}
      {uiState === "done" && (
        <p className="mt-4 text-sm text-emerald-800" role="status">
          Conversion complete. Download your {outputKind ?? "file"} above.
        </p>
      )}
    </section>
  );
}
