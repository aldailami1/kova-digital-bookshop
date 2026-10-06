import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_catalog",
  title: "Search catalog",
  description: "Search Kova books and stories by title or author, optionally filtered by kind.",
  inputSchema: {
    query: z.string().trim().max(100).optional().describe("Text to match in title or author."),
    kind: z.enum(["book", "story"]).optional().describe("Limit to books or stories."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, kind, limit }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("products")
      .select("slug,title,author,price,kind,rating,stock")
      .order("sales_count", { ascending: false })
      .limit(limit ?? 20);
    if (kind) q = q.eq("kind", kind);
    if (query) {
      const safe = query.replace(/[%,()]/g, " ");
      q = q.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);
    }
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const products = (data ?? []).map((p) => ({
      slug: p.slug, title: p.title, author: p.author, price_usd: Number(p.price),
      kind: p.kind, rating: Number(p.rating), stock: p.stock,
    }));
    return { content: [{ type: "text", text: JSON.stringify(products) }], structuredContent: { products } };
  },
});
