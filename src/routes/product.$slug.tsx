import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, BookOpen, Calendar, Package } from "lucide-react";
import { toast } from "sonner";
import { fetchProduct, fetchProducts, fetchReviews } from "@/lib/data";
import { BookCover } from "@/components/kova/BookCover";
import { Stars } from "@/components/kova/Stars";
import { ProductCard } from "@/components/kova/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Book details — Kova" },
      { name: "description", content: "Explore this title, read customer reviews, and add it to your Kova library." },
      { property: "og:title", content: "Discover a title on Kova" },
      { property: "og:description", content: "Read reviews and explore a remarkable Kova title." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add, format, user } = useStore();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const product = useQuery({ queryKey: ["product", slug], queryFn: () => fetchProduct(slug) });
  const p = product.data;
  const reviews = useQuery({ queryKey: ["reviews", p?.id], queryFn: () => p ? fetchReviews(p.id) : Promise.resolve([]), enabled: !!p });
  const all = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  if (product.isLoading) return <div className="mx-auto max-w-6xl px-4 pt-10"><Skeleton className="h-[500px] rounded-3xl" /></div>;
  if (!p) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Title not found</h1><Link to="/catalog" className="text-accent">Back to catalog</Link></div>;

  const related = (all.data ?? []).filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 4);

  const submitReview = async () => {
    if (!user) return;
    if (comment.trim().length < 3) { toast.error("Please share a little more in your review."); return; }
    setSending(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: p.id, user_id: user.id, rating, comment: comment.trim().slice(0, 1000),
      reviewer_name: user.email?.split("@")[0] || "Reader",
    });
    setSending(false);
    if (error) { toast.error("We couldn’t submit your review."); return; }
    setComment("");
    toast.success("Thank you. Your review is live.");
    qc.invalidateQueries({ queryKey: ["reviews", p.id] });
    qc.invalidateQueries({ queryKey: ["product", slug] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/catalog" search={{ kind: p.kind }}>{p.kind === "book" ? "Books" : "Stories"}</Link> / <span className="text-foreground">{p.title}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="hero-glow rounded-3xl p-8"><BookCover title={p.title} author={p.author} hue={p.cover_hue} kind={p.kind} size="lg" /></div>
        <div>
          {p.categories && <span className="rounded-full bg-secondary px-3 py-1 text-xs">{p.categories.name}</span>}
          <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">{p.title}</h1>
          <Link to="/catalog" search={{ author: p.author }} className="mt-2 inline-block text-lg text-muted-foreground hover:text-accent">{p.author}</Link>
          <div className="mt-3 flex items-center gap-2"><Stars value={Number(p.rating)} /><span className="text-sm text-muted-foreground">{Number(p.rating).toFixed(1)} · {p.reviews_count} reviews</span></div>
          <div className="mt-6 text-3xl font-bold">{format(Number(p.price))}</div>
          <p className="mt-6 text-lg leading-loose text-muted-foreground">{p.description}</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{p.pages} pages</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(p.published_at).toLocaleDateString("en-US")}</span>
            <span className="flex items-center gap-1.5"><Package className="h-4 w-4" />{p.stock > 0 ? (p.stock < 10 ? `Only ${p.stock} left` : "In stock") : "Out of stock"}</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="glass flex items-center rounded-full">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(20, q + 1))}><Plus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
            </div>
            <Button
              size="lg"
              className="rounded-full px-8"
              disabled={p.stock <= 0}
              onClick={() => {
                add({ product_id: p.id, slug: p.slug, title: p.title, author: p.author, price: Number(p.price), cover_hue: p.cover_hue }, qty);
                toast.success("Added to your bag.");
              }}
            >
              <ShoppingBag className="h-4 w-4" /> Add to bag
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-10 md:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-6 text-2xl font-bold">Reader reviews</h2>
          <div className="space-y-4">
            {(reviews.data ?? []).map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-accent-foreground">{r.reviewer_name[0]}</div>
                    <div><div className="font-semibold">{r.reviewer_name}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-US")}</div></div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-muted-foreground">{r.comment}</p>
              </div>
            ))}
            {reviews.data?.length === 0 && <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts.</p>}
          </div>
        </div>
        <div className="glass h-fit rounded-2xl p-5">
          <h3 className="font-semibold">Write a review</h3>
          {user ? (
            <div className="mt-4 space-y-3">
              <Stars value={rating} onSelect={setRating} />
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you think of this title?" maxLength={1000} />
              <Button onClick={submitReview} disabled={sending} className="w-full">Submit review</Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground"><Link to="/auth" className="text-accent">Sign in</Link> to write a review.</p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
