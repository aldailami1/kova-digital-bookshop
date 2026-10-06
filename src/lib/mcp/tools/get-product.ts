import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Get full details of one Kova title by its slug.",
  inputSchema: { slug: z.string().trim().min(1).describe("Product slug from search_catalog.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .select("slug,title,author,description,price,kind,rating,reviews_count,stock,pages")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No product with slug "${slug}"`);
    const product = {
      slug: data.slug, title: data.title, author: data.author, description: data.description,
      price_usd: Number(data.price), kind: data.kind, rating: Number(data.rating),
      reviews_count: data.reviews_count, stock: data.stock, pages: data.pages,
    };
    return { content: [{ type: "text", text: JSON.stringify(product) }], structuredContent: { product } };
  },
});
