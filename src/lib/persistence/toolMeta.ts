import { tools } from "@/lib/tools";

/**
 * The canonical slug and display name for a tool, from `src/lib/tools.ts`.
 * Adapters import this module, never `registry.ts`, so there is no cycle.
 */
export function toolMeta(slug: string): { slug: string; name: string } {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool slug "${slug}"`);
  return { slug: tool.slug, name: tool.name };
}
