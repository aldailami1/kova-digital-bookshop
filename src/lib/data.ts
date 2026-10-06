import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const KIND_LABEL = { book: "Books", story: "Stories" } as const;

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function fetchProduct(slug: string) {
  const { data, error } = await supabase.from("products").select("*, categories(name, slug)").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase.from("reviews").select("*").eq("product_id", productId).eq("approved", true).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
