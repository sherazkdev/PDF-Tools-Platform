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

  it("other tools stay non-indexable", () => {
    const others = tools.filter((t) => t.slug !== "jpg-to-pdf");
    expect(others.every((t) => !t.indexable)).toBe(true);
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
