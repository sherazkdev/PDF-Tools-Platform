import Link from "next/link";

import type { ToolDefinition } from "@/lib/tools";

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const isLive = tool.releaseStatus === "live";

  return (
    <article className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-800">
          <Link href={`/${tool.slug}`} className="after:absolute after:inset-0">
            {tool.name}
          </Link>
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isLive
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
          }`}
        >
          {isLive ? "Available" : "Coming soon"}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{tool.shortDescription}</p>
      <p className="mt-3 text-xs text-slate-500">
        Formats: {tool.supportedFormats.join(", ")}
      </p>
    </article>
  );
}
