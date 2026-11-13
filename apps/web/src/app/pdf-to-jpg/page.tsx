import type { Metadata } from "next";
import Link from "next/link";

import { PdfToJpgConverter } from "@/components/pdf-to-jpg/converter";
import { robotsForTool } from "@/lib/seo-indexing";
import { getToolBySlug } from "@/lib/tools";

function getPdfToJpgTool() {
  const found = getToolBySlug("pdf-to-jpg");
  if (!found) throw new Error("pdf-to-jpg tool definition missing");
  return found;
}

const tool = getPdfToJpgTool();

export const metadata: Metadata = {
  title: tool.title,
  description: tool.metaDescription,
  alternates: { canonical: "/pdf-to-jpg" },
  openGraph: {
    title: tool.title,
    description: tool.metaDescription,
    url: "/pdf-to-jpg",
  },
  robots: robotsForTool(tool),
};

export default function PdfToJpgPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand-700">Convert from PDF</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {tool.h1}
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          {tool.shortDescription} Upload a PDF, pick pages and quality settings, and download real
          JPG images or a ZIP archive from our Python conversion API.
        </p>
      </header>

      <PdfToJpgConverter />

      <section className="mt-14 prose prose-slate max-w-none">
        <h2 className="text-xl font-semibold text-slate-900">How to convert PDF to JPG</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
          <li>Upload a PDF (drag and drop or use Select PDF).</li>
          <li>Review the detected page count from the server.</li>
          <li>Choose all pages or enter a custom range such as <code>1-3, 5, 8</code>.</li>
          <li>Select resolution (DPI) and JPEG quality, then click Convert to JPG.</li>
          <li>Download a single JPG (one page) or a ZIP (multiple pages).</li>
        </ol>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">PDF vs JPG</h2>
        <p className="mt-2 text-slate-600">
          PDFs store pages, vectors, fonts, and images in a document model. JPG is a raster image
          format—each exported page becomes pixels. Text remains readable at higher DPI but is not
          editable as text after export.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Resolution (DPI)</h2>
        <p className="mt-2 text-slate-600">
          Presets: 72 (standard), 150 (high), 200 (very high), and 300 (maximum). Pixel dimensions
          scale with DPI relative to the PDF page size in points. Oversized pages at maximum DPI may
          be rejected to protect server memory.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Page selection</h2>
        <p className="mt-2 text-slate-600">
          Page numbers start at 1. Ranges must not be reversed. Duplicates are normalized. Output
          order follows the original PDF document order.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Single JPG vs ZIP</h2>
        <p className="mt-2 text-slate-600">
          Exactly one selected page produces one <code>.jpg</code> file. Two or more pages produce a
          ZIP containing one JPG per page with names like <code>document-page-001.jpg</code>.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Privacy and file retention</h2>
        <p className="mt-2 text-slate-600">
          Uploads are stored in isolated job folders only long enough to convert and download. Files
          expire automatically after the configured retention period.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Limitations</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-600">
          {tool.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">FAQ</h2>
        <dl className="mt-4 space-y-6">
          <div>
            <dt className="font-medium text-slate-900">Are password-protected PDFs supported?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              Not yet. Encrypted PDFs are rejected with a clear message in the converter.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Does higher JPEG quality always mean a larger file?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              Quality affects encoder settings; file size also depends on page content and resolution.
            </dd>
          </div>
        </dl>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Related tools</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {tool.relatedTools.map((slug) => (
            <li key={slug}>
              <Link
                href={`/${slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300"
              >
                {slug.replace(/-/g, " ")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
