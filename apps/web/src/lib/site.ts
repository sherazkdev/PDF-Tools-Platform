export const siteConfig = {
  name: "ForgePDF",
  tagline: "Professional PDF conversion tools",
  description:
    "Convert images, Office files, and HTML to PDF—and export PDFs to popular formats—with a fast, privacy-minded workflow.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en",
} as const;
