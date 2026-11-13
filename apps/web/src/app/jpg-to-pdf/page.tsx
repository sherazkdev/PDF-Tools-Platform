import type { Metadata } from "next";
import Link from "next/link";

import { JpgToPdfConverter } from "@/components/jpg-to-pdf/converter";
import { robotsForTool } from "@/lib/seo-indexing";
import { getToolBySlug } from "@/lib/tools";

function getJpgTool() {
  const found = getToolBySlug("jpg-to-pdf");
  if (!found) throw new Error("jpg-to-pdf tool definition missing");
  return found;
}

const tool = getJpgTool();

export const metadata: Metadata = {
  title: tool.title,
  description: tool.metaDescription,
  alternates: { canonical: "/jpg-to-pdf" },
  openGraph: {
    title: tool.title,
    description: tool.metaDescription,
    url: "/jpg-to-pdf",
  },
  robots: robotsForTool(tool),
};

export default function JpgToPdfPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand-700">Convert to PDF</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {tool.h1}
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          {tool.shortDescription} Upload JPEG photos, arrange page order, pick A4 or Letter
          layout, and download a real PDF produced by our Python conversion API.
        </p>
      </header>

      <JpgToPdfConverter />

      <section className="mt-14 prose prose-slate max-w-none">
        <h2 className="text-xl font-semibold text-slate-900">How to convert JPG to PDF</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
          <li>Select one or more JPG or JPEG images, or drag them into the upload area.</li>
          <li>Reorder images using the Up and Down controls so your PDF pages match your intent.</li>
          <li>Choose page size, orientation, and margins (margins apply to A4 and Letter).</li>
          <li>Click Convert to PDF and download the file when processing completes.</li>
        </ol>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Supported formats</h2>
        <p className="mt-2 text-slate-600">
          Standard JPEG files (`.jpg`, `.jpeg`) with valid image content. Files are validated on the
          server—not only by filename.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Page size and margins</h2>
        <p className="mt-2 text-slate-600">
          <strong>Fit to image</strong> creates one PDF page per photo at the image dimensions
          (after EXIF orientation is applied). <strong>A4</strong> and <strong>US Letter</strong> place
          each image inside a standard page using contain scaling—aspect ratio is preserved and images
          are not stretched. Margins on A4/Letter: none, small (¼ inch), medium (½ inch), or large
          (1 inch).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-900">Privacy and file retention</h2>
        <p className="mt-2 text-slate-600">
          Uploads are stored in isolated job folders only long enough to convert and download. Files
          expire automatically after the configured retention period (default one hour on the API).
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
            <dt className="font-medium text-slate-900">Is this conversion lossless?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              When possible we embed JPEG data directly. If EXIF rotation requires re-saving, quality
              may change slightly— we do not claim every output is bit-identical.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Can I combine many photos into one PDF?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              Yes. Each image becomes one page in order. Up to 50 images per job (subject to size
              limits).
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
