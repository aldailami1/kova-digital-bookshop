import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { BookCover } from "./BookCover";
import { Stars } from "./Stars";
import { Button } from "@/components/ui/button";

export function ProductCard({ p }: { p: Product }) {
  const { add, format } = useStore();
  return (
    <div className="group flex flex-col">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block transition-transform duration-500 group-hover:-translate-y-1.5">
        <BookCover title={p.title} author={p.author} hue={p.cover_hue} kind={p.kind} />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="font-display font-semibold leading-snug hover:text-accent">
          {p.title}
        </Link>
        <span className="text-sm text-muted-foreground">{p.author}</span>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Stars value={Number(p.rating)} /> <span>({p.reviews_count})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-bold">{format(Number(p.price))}</span>
          <Button
            size="icon"
            variant="secondary"
            aria-label="أضف إلى السلة"
            disabled={p.stock <= 0}
            onClick={() => {
              add({ product_id: p.id, slug: p.slug, title: p.title, author: p.author, price: Number(p.price), cover_hue: p.cover_hue });
              toast.success(`أُضيف «${p.title}» إلى السلة`);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
