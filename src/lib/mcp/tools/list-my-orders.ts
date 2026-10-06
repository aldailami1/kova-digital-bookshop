import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the signed-in user's Kova orders, newest first.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select("id,status,total,currency,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new ToolError(error.message);
    const orders = (data ?? []).map((o) => ({
      id: o.id, status: o.status, total: Number(o.total), currency: o.currency, created_at: o.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(orders) }], structuredContent: { orders } };
  },
});
