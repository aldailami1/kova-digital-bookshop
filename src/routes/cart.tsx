import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/kova/BookCover";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping bag — Kova" },
      { name: "description", content: "Review your Kova titles and quantities before checkout." },
      { property: "og:title", content: "Shopping bag — Kova" },
      { property: "og:description", content: "Your selected books and stories at Kova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { items, setQty, remove, subtotal, format, count } = useStore();
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your bag is empty</h1>
        <p className="mt-2 text-muted-foreground">Start your next journey with a remarkable read.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/catalog">Browse the catalog</Link></Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="text-3xl font-extrabold">Shopping bag <span className="text-lg text-muted-foreground">({count})</span></h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.map((i) => (
            <div key={i.product_id} className="glass flex gap-4 rounded-2xl p-4">
              <Link to="/product/$slug" params={{ slug: i.slug }} className="w-20 shrink-0"><BookCover title={i.title} author={i.author} hue={i.cover_hue} size="sm" /></Link>
              <div className="flex flex-1 flex-col">
                <Link to="/product/$slug" params={{ slug: i.slug }} className="font-semibold">{i.title}</Link>
                <span className="text-sm text-muted-foreground">{i.author}</span>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border">
                    <Button variant="ghost" size="icon" onClick={() => setQty(i.product_id, i.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center">{i.quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQty(i.product_id, i.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                  </div>
                  <span className="font-bold">{format(i.price * i.quantity)}</span>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.product_id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="glass h-fit space-y-3 rounded-2xl p-6">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{format(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Digital delivery</span><span className="text-accent">Free</span></div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{format(subtotal)}</span></div>
          <Button asChild size="lg" className="w-full rounded-full"><Link to="/checkout">Continue to checkout</Link></Button>
        </div>
      </div>
    </div>
  );
}
