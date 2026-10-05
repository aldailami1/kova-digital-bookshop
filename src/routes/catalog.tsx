import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { fetchCategories, fetchProducts } from "@/lib/data";
import { ProductCard } from "@/components/kova/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Search = { q?: string | undefined; kind?: "book" | "story" | undefined; genre?: string | undefined; author?: string | undefined; max?: number | undefined; sort?: "new" | "best" | "price-asc" | "price-desc" | "rating" | undefined };

export const Route = createFileRoute("/catalog")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    kind: s["kind"] === "book" || s["kind"] === "story" ? s["kind"] : undefined,
    genre: typeof s["genre"] === "string" ? s["genre"] : undefined,
    author: typeof s["author"] === "string" ? s["author"] : undefined,
    max: typeof s["max"] === "number" ? s["max"] : undefined,
    sort: ["new", "best", "price-asc", "price-desc", "rating"].includes(s["sort"] as string) ? (s["sort"] as Search["sort"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الكتالوج — Kova" },
      { name: "description", content: "تصفّح جميع الكتب والقصص في Kova وفلترها حسب النوع والمؤلف والسعر." },
      { property: "og:title", content: "كتالوج Kova" },
      { property: "og:description", content: "ابحث وفلتر بين الروايات والقصص العربية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/catalog" });
  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const { format } = useStore();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const cats = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const maxPrice = Math.ceil(Math.max(30, ...(products.data ?? []).map((p) => Number(p.price))));
  const authors = useMemo(() => [...new Set((products.data ?? []).filter((p) => !s.kind || p.kind === s.kind).map((p) => p.author))].sort(), [products.data, s.kind]);

  const results = useMemo(() => {
    const q = (s.q ?? "").trim().toLowerCase();
    let list = (products.data ?? []).filter((p) => {
      if (s.kind && p.kind !== s.kind) return false;
      if (s.genre && p.category_id !== s.genre) return false;
      if (s.author && p.author !== s.author) return false;
      if (s.max !== undefined && Number(p.price) > s.max) return false;
      if (q && !`${p.title} ${p.author} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorters: Record<string, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      new: (a, b) => b.published_at.localeCompare(a.published_at),
      best: (a, b) => b.sales_count - a.sales_count,
      "price-asc": (a, b) => Number(a.price) - Number(b.price),
      "price-desc": (a, b) => Number(b.price) - Number(a.price),
      rating: (a, b) => Number(b.rating) - Number(a.rating),
    };
    if (s.sort) list = [...list].sort(sorters[s.sort]);
    return list;
  }, [products.data, s]);

  const genres = (cats.data ?? []).filter((c) => !s.kind || c.kind === s.kind);
  const chip = (active: boolean) => cn("rounded-full border px-3 py-1 text-sm transition", active ? "border-transparent bg-primary text-primary-foreground" : "hover:bg-secondary");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">{s.kind === "book" ? "الكتب" : s.kind === "story" ? "القصص" : "كل العناوين"}</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <button className={chip(!s.kind)} onClick={() => set({ kind: undefined, genre: undefined, author: undefined })}>الكل</button>
        <button className={chip(s.kind === "book")} onClick={() => set({ kind: "book", genre: undefined, author: undefined })}>الكتب</button>
        <button className={chip(s.kind === "story")} onClick={() => set({ kind: "story", genre: undefined, author: undefined })}>القصص</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="glass h-fit space-y-6 rounded-2xl p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" /> الفلاتر</div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={s.q ?? ""}
              onChange={(e) => set({ q: e.target.value || undefined })}
              placeholder="بحث فوري..."
              className="h-10 w-full rounded-xl border bg-background/60 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">النوع الأدبي</div>
            <div className="flex flex-wrap gap-2">
              <button className={chip(!s.genre)} onClick={() => set({ genre: undefined })}>الكل</button>
              {genres.map((g) => <button key={g.id} className={chip(s.genre === g.id)} onClick={() => set({ genre: g.id })}>{g.name}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">المؤلف</div>
            <select value={s.author ?? ""} onChange={(e) => set({ author: e.target.value || undefined })} className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm">
              <option value="">كل المؤلفين</option>
              {authors.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-3 flex justify-between text-sm font-medium"><span>السعر الأقصى</span><span className="text-muted-foreground">{format(s.max ?? maxPrice)}</span></div>
            <Slider dir="rtl" min={1} max={maxPrice} step={1} value={[s.max ?? maxPrice]} onValueChange={([v = maxPrice]) => set({ max: v >= maxPrice ? undefined : v })} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">الترتيب</div>
            <select value={s.sort ?? ""} onChange={(e) => set({ sort: (e.target.value || undefined) as Search["sort"] })} className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm">
              <option value="">الافتراضي</option>
              <option value="new">الإصدارات الجديدة</option>
              <option value="best">الأكثر مبيعاً</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
            </select>
          </div>
          <button className="text-sm text-accent" onClick={() => navigate({ search: { kind: s.kind } })}>مسح الفلاتر</button>
        </aside>

        <div>
          <p className="mb-6 text-sm text-muted-foreground">{results.length} نتيجة</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {products.isLoading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3]" />)
              : results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {!products.isLoading && results.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">لا توجد نتائج مطابقة. جرّب تعديل الفلاتر.</div>
          )}
        </div>
      </div>
    </div>
  );
}
