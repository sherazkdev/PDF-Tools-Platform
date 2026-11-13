"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type JpgConversionSettings,
  type LocalJpgFile,
  DEFAULT_SETTINGS,
  MAX_JPG_BYTES,
  MAX_JPG_FILES,
} from "@/components/jpg-to-pdf/types";
import {
  JobsApiError,
  createJob,
  downloadJobOutput,
} from "@/lib/jobs-api";

type UiState =
  | "empty"
  | "ready"
  | "converting"
  | "done"
  | "error";

function newId(): string {
  return crypto.randomUUID();
}

function isJpeg(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || file.type === "image/jpeg";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function JpgToPdfConverter() {
  const [files, setFiles] = useState<LocalJpgFile[]>([]);
  const [settings, setSettings] = useState<JpgConversionSettings>(DEFAULT_SETTINGS);
  const [uiState, setUiState] = useState<UiState>("empty");
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const revokeAll = useCallback((items: LocalJpgFile[]) => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeAll(files);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl, files, revokeAll]);

  const addFiles = (incoming: FileList | File[]) => {
    setMessage(null);
    const list = Array.from(incoming);
    const next: LocalJpgFile[] = [];
    for (const file of list) {
      if (!isJpeg(file)) {
        setMessage(`"${file.name}" is not a JPG/JPEG file.`);
        continue;
      }
      if (file.size === 0) {
        setMessage(`"${file.name}" is empty.`);
        continue;
      }
      if (file.size > MAX_JPG_BYTES) {
        setMessage(`"${file.name}" exceeds the upload size limit.`);
        continue;
      }
      if (files.length + next.length >= MAX_JPG_FILES) {
        setMessage(`Maximum ${MAX_JPG_FILES} images per conversion.`);
        break;
      }
      next.push({
        id: newId(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length) {
      setFiles((prev) => [...prev, ...next]);
      setUiState("ready");
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const updated = prev.filter((f) => f.id !== id);
      if (updated.length === 0) setUiState("empty");
      return updated;
    });
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const clearAll = () => {
    revokeAll(files);
    setFiles([]);
    setUiState("empty");
    setMessage(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!files.length || uiState === "converting") return;
    setUiState("converting");
    setMessage(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    try {
      const effectiveSettings = {
        ...settings,
        margins: settings.page_size === "fit" ? ("none" as const) : settings.margins,
      };
      const result = await createJob(
        "jpg-to-pdf",
        files.map((f) => f.file),
        { settings: effectiveSettings },
      );
      if (result.status === "failed") {
        throw new JobsApiError(
          "Conversion failed. Check your images and try again.",
          "conversion_failed",
        );
      }
      if (result.status !== "completed") {
        throw new JobsApiError(
          `Job status: ${result.status}. Try again shortly.`,
          "job_not_ready",
        );
      }
      sessionStorage.setItem(
        `forgepdf:job:${result.job_id}`,
        result.access_token,
      );
      const blob = await downloadJobOutput(result.job_id, result.access_token);
      setDownloadUrl(URL.createObjectURL(blob));
      setUiState("done");
    } catch (err) {
      setUiState("error");
      setMessage(
        err instanceof JobsApiError ? err.message : "Conversion failed. Try again.",
      );
    }
  };

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="converter-heading"
    >
      <h2 id="converter-heading" className="sr-only">
        JPG to PDF converter
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
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-brand-400 bg-brand-50"
            : "border-slate-300 bg-slate-50/80"
        }`}
      >
        <p className="text-base font-medium text-slate-800">
          Drag JPG images here
        </p>
        <p className="mt-1 text-sm text-slate-500">or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Select JPG images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <p className="mt-4 text-sm text-amber-900" role="alert">
          {message}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-6 space-y-3" aria-label="Selected images">
          {files.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-slate-200 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className="h-14 w-14 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.file.name}
                </p>
                <p className="text-xs text-slate-500">{formatBytes(item.file.size)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveFile(index, -1)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === files.length - 1}
                  onClick={() => moveFile(index, 1)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="mt-8 grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-slate-900">
          Page settings
        </legend>
        <label className="text-sm text-slate-700">
          Page size
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={settings.page_size}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                page_size: e.target.value as JpgConversionSettings["page_size"],
              }))
            }
          >
            <option value="fit">Fit to image</option>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Orientation
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={settings.orientation}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                orientation: e.target.value as JpgConversionSettings["orientation"],
              }))
            }
          >
            <option value="auto">Automatic</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Margins
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={settings.page_size === "fit"}
            value={settings.page_size === "fit" ? "none" : settings.margins}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                margins: e.target.value as JpgConversionSettings["margins"],
              }))
            }
          >
            <option value="none">No margin</option>
            <option value="small">Small (¼″)</option>
            <option value="medium">Medium (½″)</option>
            <option value="large">Large (1″)</option>
          </select>
        </label>
      </fieldset>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!files.length || uiState === "converting"}
          onClick={() => void convert()}
          className="inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uiState === "converting" ? "Converting…" : "Convert to PDF"}
        </button>
        {files.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Clear selection
          </button>
        )}
        {uiState === "done" && downloadUrl && (
          <a
            href={downloadUrl}
            download="forgepdf-images.pdf"
            className="inline-flex rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          >
            Download PDF
          </a>
        )}
      </div>

      {uiState === "converting" && (
        <p className="mt-4 text-sm text-slate-600" role="status">
          Uploading and building your PDF…
        </p>
      )}
      {uiState === "done" && (
        <p className="mt-4 text-sm text-emerald-800" role="status">
          Conversion complete. Download your PDF above.
        </p>
      )}
    </section>
  );
}
