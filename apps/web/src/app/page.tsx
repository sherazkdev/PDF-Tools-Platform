import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { ToolCard } from "@/components/tool-card";
import { siteConfig } from "@/lib/site";
import { toolsByCategory } from "@/lib/tools";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Document conversion workspace
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Convert files to PDF—and back—with clarity and control
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            {siteConfig.name} is building a focused set of ten conversion tools powered by a secure
            Python API. Upload your files, adjust sensible options, download real outputs, and know
            exactly what each tool can and cannot do.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#convert-to-pdf"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Browse converters
            </a>
            <Link
              href="/jpg-to-pdf"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              JPG to PDF
            </Link>
            <Link
              href="/pdf-to-jpg"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              PDF to JPG
            </Link>
          </div>
          <div className="mt-10 max-w-xl">
            <ApiStatus />
          </div>
        </div>
      </section>

      <section id="convert-to-pdf" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Convert to PDF</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Create PDFs from images, Microsoft Office files, and HTML. Tools below are listed with
          honest release status—only tools marked Available are verified end-to-end.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolsByCategory["to-pdf"].map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </section>

      <section
        id="convert-from-pdf"
        className="border-y border-slate-200/80 bg-white mx-auto max-w-6xl px-4 py-14 sm:px-6"
      >
        <h2 className="text-2xl font-bold text-slate-900">Convert from PDF</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Export PDF pages to images or editable Office formats, extract tables, or create archival
          PDF/A files—with limitations stated up front.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolsByCategory["from-pdf"].map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">How ForgePDF works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Choose a tool",
              body: "Pick the converter that matches your source file format.",
            },
            {
              step: "2",
              title: "Upload securely",
              body: "Files are validated on the server—type, size, and content checks—not just the file name.",
            },
            {
              step: "3",
              title: "Convert in the API",
              body: "All processing runs in FastAPI workers; the website handles UI and downloads only.",
            },
            {
              step: "4",
              title: "Download & expire",
              body: "Retrieve your output with an unguessable job link. Temporary files are deleted automatically.",
            },
          ].map((item) => (
            <li key={item.step} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="text-xs font-bold text-brand-600">Step {item.step}</span>
              <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-slate-900 px-6 py-10 text-slate-100 sm:px-10">
          <h2 className="text-xl font-semibold">Built for search, speed, and trust</h2>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <li>Server-rendered pages with unique titles and descriptions per tool</li>
            <li>No fake progress bars or simulated downloads</li>
            <li>Clear FAQs and limitations on every converter page</li>
            <li>Accessible upload targets and keyboard-friendly navigation</li>
          </ul>
        </div>
      </section>
    </>
  );
}
