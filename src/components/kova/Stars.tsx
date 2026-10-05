import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, className, onSelect }: { value: number; className?: string; onSelect?: (v: number) => void }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          type="button"
          key={i}
          disabled={!onSelect}
          onClick={() => onSelect?.(i)}
          className={cn(onSelect ? "cursor-pointer" : "cursor-default")}
          aria-label={`${i} نجوم`}
        >
          <Star className={cn("h-4 w-4", i <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
