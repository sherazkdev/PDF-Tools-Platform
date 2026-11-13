import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";
import { isToolIndexable } from "@/lib/seo-indexing";
import { tools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");

  const home: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const toolEntries: MetadataRoute.Sitemap = tools
    .filter((t) => isToolIndexable(t))
    .map((tool) => ({
      url: `${base}/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...home, ...toolEntries];
}
