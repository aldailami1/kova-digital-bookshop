import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, Trash2, X, DollarSign, Package, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchProducts, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/kova/Stars";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Kova" },
      { name: "description", content: "Manage Kova products, categories, orders, inventory, and reviews." },
      { property: "og:title", content: "Admin dashboard — Kova" },
      { property: "og:description", content: "Kova store administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Draft = Partial<Product> & { title: string; author: string; price: number; kind: "book" | "story" };
const emptyDraft: Draft = { title: "", author: "", price: 9.99, kind: "book", description: "", stock: 50, cover_hue: 30, pages: 200, is_featured: false };

function Admin() {
  const { user } = Route.useRouteContext();
  const { format } = useStore();
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data ?? false,
  });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts, enabled: !!role.data });
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, enabled: !!role.data });
  const orders = useQuery({
    queryKey: ["admin-orders"], enabled: !!role.data,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(title, quantity)").order("created_at", { ascending: false })).data ?? [],
  });
  const reviews = useQuery({
    queryKey: ["admin-reviews"], enabled: !!role.data,
    queryFn: async () => (await supabase.from("reviews").select("*, products(title)").order("created_at", { ascending: false })).data ?? [],
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState({ name: "", kind: "book" as "book" | "story" });

  if (role.isLoading) return <div className="py-24 text-center text-muted-foreground">Checking access…</div>;
  if (!role.data) return <div className="py-24 text-center"><h1 className="text-2xl font-bold">Access denied</h1><Link to="/" className="text-accent">Return home</Link></div>;

  const refresh = (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const saveProduct = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.author.trim()) { toast.error("Title and author are required."); return; }
    const row = {
      title: draft.title.trim(), author: draft.author.trim(), price: Number(draft.price), kind: draft.kind,
      description: draft.description ?? "", stock: Number(draft.stock ?? 0), cover_hue: Number(draft.cover_hue ?? 30),
      pages: Number(draft.pages ?? 100), is_featured: !!draft.is_featured, category_id: draft.category_id ?? null,
    };
    const { error } = draft.id
      ? await supabase.from("products").update(row).eq("id", draft.id)
      : await supabase.from("products").insert({ ...row, slug: `p-${Date.now().toString(36)}` });
    if (error) { toast.error("Unable to save."); return; }
    toast.success("Saved successfully.");
    setDraft(null);
    refresh("products");
  };

  const delProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Unable to delete."); return; }
    refresh("products");
  };

  const updateStock = async (id: string, stock: number) => {
    await supabase.from("products").update({ stock: Math.max(0, stock) }).eq("id", id);
    refresh("products");
  };

  const addCat = async () => {
    if (!newCat.name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCat.name.trim(), kind: newCat.kind, slug: `c-${Date.now().toString(36)}` });
    if (error) { toast.error("Unable to add."); return; }
    setNewCat({ name: "", kind: newCat.kind });
    refresh("categories");
  };

  const allOrders = orders.data ?? [];
  const revenue = allOrders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const lowStock = (products.data ?? []).filter((p) => p.stock < 10).length;
  const pending = (reviews.data ?? []).filter((r) => !r.approved).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="text-3xl font-extrabold">Admin dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { i: DollarSign, l: "Revenue", v: format(revenue) },
          { i: ShoppingCart, l: "Orders", v: allOrders.length },
          { i: Package, l: "Low stock", v: lowStock },
          { i: Star, l: "Reviews", v: `${reviews.data?.length ?? 0} (${pending} pending)` },
        ].map(({ i: I, l, v }) => (
          <div key={l} className="glass rounded-2xl p-5"><I className="h-5 w-5 text-accent" /><div className="mt-2 text-2xl font-bold">{v}</div><div className="text-sm text-muted-foreground">{l}</div></div>
        ))}
      </div>

      <Tabs defaultValue="products" className="mt-8" dir="ltr">
        <TabsList className="flex-wrap">
          <TabsTrigger value="products">Products & inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Button onClick={() => setDraft({ ...emptyDraft })} className="mb-4"><Plus className="h-4 w-4" /> New product</Button>
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground"><th className="p-3 text-right">Title</th><th>Type</th><th>Price</th><th>Stock</th><th>Sales</th><th /></tr></thead>
              <tbody>
                {(products.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3"><div className="font-medium">{p.title}</div><div className="text-xs text-muted-foreground">{p.author}</div></td>
                    <td className="text-center">{p.kind === "book" ? "Book" : "Story"}</td>
                    <td className="text-center">{format(Number(p.price))}</td>
                    <td className="text-center">
                      <Input type="number" defaultValue={p.stock} className={`mx-auto h-8 w-20 text-center ${p.stock < 10 ? "border-destructive" : ""}`} onBlur={(e) => Number(e.target.value) !== p.stock && updateStock(p.id, Number(e.target.value))} />
                    </td>
                    <td className="text-center">{p.sales_count}</td>
                    <td className="whitespace-nowrap p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDraft({ ...p, price: Number(p.price) })}>Edit</Button>
                      <Button size="icon" variant="ghost" onClick={() => delProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="glass flex flex-wrap gap-3 rounded-2xl p-4">
            <Input placeholder="Category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="max-w-xs" />
            <select value={newCat.kind} onChange={(e) => setNewCat({ ...newCat, kind: e.target.value as "book" | "story" })} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="book">Books</option><option value="story">Stories</option>
            </select>
            <Button onClick={addCat}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(cats.data ?? []).map((c) => (
              <div key={c.id} className="glass flex items-center justify-between rounded-xl p-4">
                <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.kind === "book" ? "Books" : "Stories"}</div></div>
                <Button size="icon" variant="ghost" onClick={async () => { if (!confirm("Delete this category?")) return; await supabase.from("categories").delete().eq("id", c.id); refresh("categories", "products"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="space-y-3">
            {allOrders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
            {allOrders.map((o) => (
              <div key={o.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
                <div>
                  <div className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()} · {o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar")} — {o.order_items.map((i) => `${i.title}×${i.quantity}`).join("، ")}</div>
                </div>
                <span className="font-bold">{format(Number(o.total))}</span>
                <select
                  value={o.status}
                  onChange={async (e) => { await supabase.from("orders").update({ status: e.target.value }).eq("id", o.id); refresh("admin-orders"); }}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="paid">Paid</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="refunded">Refunded</option>
                </select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {(reviews.data ?? []).map((r) => (
            <div key={r.id} className="glass flex flex-wrap items-start justify-between gap-3 rounded-xl p-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-sm"><b>{r.reviewer_name}</b> on “{r.products?.title}” <Stars value={r.rating} /></div>
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${r.approved ? "bg-secondary" : "bg-accent text-accent-foreground"}`}>{r.approved ? "Published" : "Hidden"}</span>
                <Button size="icon" variant="ghost" title={r.approved ? "Hide" : "Publish"} onClick={async () => { await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id); refresh("admin-reviews", "products"); }}>
                  {r.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={async () => { await supabase.from("reviews").delete().eq("id", r.id); refresh("admin-reviews", "products"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent dir="ltr" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <div className="space-y-1"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Author</Label><Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Price (USD)</Label><Input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Stock</Label><Input type="number" value={draft.stock ?? 0} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Page count</Label><Input type="number" value={draft.pages ?? 0} onChange={(e) => setDraft({ ...draft, pages: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Cover color (0–360)</Label><Input type="number" min={0} max={360} value={draft.cover_hue ?? 30} onChange={(e) => setDraft({ ...draft, cover_hue: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Type</Label>
                  <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as "book" | "story", category_id: null })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="book">Book</option><option value="story">Story</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>Category</Label>
                  <select value={draft.category_id ?? ""} onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="">None</option>
                    {(cats.data ?? []).filter((c) => c.kind === draft.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={!!draft.is_featured} onCheckedChange={(v) => setDraft({ ...draft, is_featured: v })} /><Label>Featured product</Label></div>
              <Button onClick={saveProduct}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
