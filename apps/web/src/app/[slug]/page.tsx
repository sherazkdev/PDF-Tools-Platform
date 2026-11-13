import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { robotsForTool } from "@/lib/seo-indexing";
import { getToolBySlug, tools } from "@/lib/tools";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return tools
    .filter((tool) => tool.slug !== "jpg-to-pdf")
    .map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Not found" };
  }

  return {
    title: tool.title,
    description: tool.metaDescription,
    alternates: {
      canonical: `/${tool.slug}`,
    },
    openGraph: {
      title: tool.title,
      description: tool.metaDescription,
      url: `/${tool.slug}`,
    },
    robots: robotsForTool(tool),
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    notFound();
  }

  const related = tool.relatedTools
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {tool.releaseStatus !== "live" && (
        <div
          className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <strong className="font-semibold">Coming soon.</strong> This converter is under active
          development. Upload and download controls will appear here once end-to-end conversion is
          tested—there is no simulated output.
        </div>
      )}

      <header>
        <p className="text-sm font-medium text-brand-700">
          {tool.category === "to-pdf" ? "Convert to PDF" : "Convert from PDF"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {tool.h1}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{tool.shortDescription}</p>
      </header>

      <section className="mt-10" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="text-lg font-semibold text-slate-900">
          Upload area
        </h2>
        <div
          className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center"
          aria-disabled="true"
        >
          <p className="text-sm font-medium text-slate-700">File upload disabled during development</p>
          <p className="mt-2 text-sm text-slate-500">
            Supported formats: {tool.supportedFormats.join(", ")}
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-lg font-semibold text-slate-900">
          Why use this converter
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
          {tool.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-slate-900">
          Limitations
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
          {tool.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-semibold text-slate-900">
          Frequently asked questions
        </h2>
        <dl className="mt-4 space-y-6">
          <div>
            <dt className="font-medium text-slate-900">Is my file stored permanently?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              No. Uploaded inputs and conversion outputs are kept only for a limited time to
              complete your job, then removed automatically.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">When will this tool be available?</dt>
            <dd className="mt-1 text-sm text-slate-600">
              We enable indexing and the live upload workflow only after automated conversion tests
              pass for this specific tool.
            </dd>
          </div>
        </dl>
      </section>

      {related.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-10" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-lg font-semibold text-slate-900">
            Related tools
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {related.map((rel) => (
              <li key={rel.slug}>
                <Link
                  href={`/${rel.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-800"
                >
                  {rel.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
