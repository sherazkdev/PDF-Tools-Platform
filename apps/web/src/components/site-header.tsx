import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { toolsByCategory } from "@/lib/tools";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm"
            aria-hidden
          >
            FP
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-brand-700">
            {siteConfig.name}
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <li>
              <a href="#convert-to-pdf" className="hover:text-brand-700">
                To PDF
              </a>
            </li>
            <li>
              <a href="#convert-from-pdf" className="hover:text-brand-700">
                From PDF
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-brand-700">
                How it works
              </a>
            </li>
          </ul>
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            Tools
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Convert to PDF
            </p>
            <ul className="mb-3 space-y-1 text-sm">
              {toolsByCategory["to-pdf"].map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="block rounded px-2 py-1 hover:bg-slate-50">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              From PDF
            </p>
            <ul className="space-y-1 text-sm">
              {toolsByCategory["from-pdf"].map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="block rounded px-2 py-1 hover:bg-slate-50">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
