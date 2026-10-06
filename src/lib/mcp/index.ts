import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchCatalog from "./tools/search-catalog";
import getProduct from "./tools/get-product";
import listMyOrders from "./tools/list-my-orders";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "kova-your-digital-library",
  title: "Kova: Your Digital Library",
  version: "0.1.0",
  instructions:
    "Tools for the Kova bookstore. Use `search_catalog` to find books and stories, `get_product` for details, and `list_my_orders` for the signed-in reader's orders. Prices are in USD.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchCatalog, getProduct, listMyOrders],
});
