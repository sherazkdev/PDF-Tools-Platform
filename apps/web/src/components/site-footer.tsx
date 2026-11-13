import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{siteConfig.name}</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">{siteConfig.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Converters</p>
            <ul className="mt-3 columns-2 gap-4 text-sm text-slate-600">
              {tools.map((tool) => (
                <li key={tool.slug} className="mb-2 break-inside-avoid">
                  <Link href={`/${tool.slug}`} className="hover:text-brand-700">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Information</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Privacy policy (coming soon)</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of use (coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          © {year} {siteConfig.name}. Files are processed for conversion and removed after expiry.
        </p>
      </div>
    </footer>
  );
}
