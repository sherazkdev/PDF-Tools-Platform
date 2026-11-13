import type { ToolDefinition } from "@/lib/tools";

/** Production sitemap/indexing gate — keep false in local .env. */
export function isPublicToolIndexingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEX === "true";
}

export function isToolIndexable(tool: ToolDefinition): boolean {
  return tool.indexable && isPublicToolIndexingEnabled();
}

export function robotsForTool(tool: ToolDefinition): { index: boolean; follow: boolean } {
  return isToolIndexable(tool)
    ? { index: true, follow: true }
    : { index: false, follow: false };
}
