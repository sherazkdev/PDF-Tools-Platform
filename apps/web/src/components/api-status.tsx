"use client";

import { useCallback, useEffect, useState } from "react";

import { type ApiHealth, ApiError, fetchApiHealth } from "@/lib/api";

type Status = "idle" | "loading" | "ok" | "error";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState<ApiHealth | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const health = await fetchApiHealth();
      setDetail(health);
      setStatus("ok");
    } catch (err) {
      setDetail(null);
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Unexpected error");
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-slate-800">Conversion API</p>
        <button
          type="button"
          onClick={() => void check()}
          disabled={status === "loading"}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {status === "loading" ? "Checking…" : "Retry"}
        </button>
      </div>
      {status === "ok" && detail && (
        <p className="mt-2 text-slate-600">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Connected
          </span>
          {" · "}
          {detail.service} v{detail.version} ({detail.environment})
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-amber-900">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            Offline
          </span>
          {message ? ` — ${message}` : null}
        </p>
      )}
      {status === "idle" || status === "loading" ? (
        <p className="mt-2 text-slate-500">Checking API…</p>
      ) : null}
    </div>
  );
}
