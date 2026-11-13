import { describe, expect, it } from "vitest";

import { isToolIndexable, robotsForTool } from "@/lib/seo-indexing";
import { getToolBySlug, tools } from "@/lib/tools";

describe("SEO indexing rules", () => {
  const jpg = getToolBySlug("jpg-to-pdf");
  const word = getToolBySlug("word-to-pdf");

  it("jpg-to-pdf is marked live in config", () => {
    expect(jpg?.releaseStatus).toBe("live");
    expect(jpg?.indexable).toBe(true);
  });

  it("only live tools are marked indexable in config", () => {
    for (const t of tools) {
      if (t.releaseStatus === "live") {
        expect(t.indexable).toBe(true);
      } else {
        expect(t.indexable).toBe(false);
      }
    }
  });

  it("pdf-to-jpg is live", () => {
    const pdf = getToolBySlug("pdf-to-jpg");
    expect(pdf?.releaseStatus).toBe("live");
  });

  it("respects NEXT_PUBLIC_SITE_INDEX gate", () => {
    const original = process.env.NEXT_PUBLIC_SITE_INDEX;
    process.env.NEXT_PUBLIC_SITE_INDEX = "false";
    expect(isToolIndexable(jpg!)).toBe(false);
    expect(robotsForTool(jpg!)).toEqual({ index: false, follow: false });
    process.env.NEXT_PUBLIC_SITE_INDEX = "true";
    expect(isToolIndexable(jpg!)).toBe(true);
    expect(robotsForTool(word!)).toEqual({ index: false, follow: false });
    process.env.NEXT_PUBLIC_SITE_INDEX = original;
  });
});
