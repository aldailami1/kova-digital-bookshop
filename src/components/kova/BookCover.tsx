import { cn } from "@/lib/utils";

type Props = { title: string; author: string; hue: number; kind?: string; className?: string; size?: "sm" | "md" | "lg" };

// Generative cover: color is derived from each product's stored hue so every title gets a unique jacket.
export function BookCover({ title, author, hue, kind, className, size = "md" }: Props) {
  const bg = `linear-gradient(155deg, oklch(0.62 0.13 ${hue}) 0%, oklch(0.36 0.1 ${(hue + 40) % 360}) 100%)`;
  return (
    <div
      className={cn("relative aspect-[2/3] overflow-hidden rounded-lg shadow-soft select-none", className)}
      style={{ background: bg }}
    >
      <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-foreground/25 to-transparent" />
      <div className="absolute inset-3 rounded-md border border-primary-foreground/25" />
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between p-5 text-primary-foreground dark:text-foreground">
        <span className="text-[10px] tracking-widest opacity-80">{kind === "story" ? "STORY" : "KOVA"}</span>
        <div>
          <h3 className={cn("font-display font-bold leading-snug drop-shadow", size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-lg")}>
            {title}
          </h3>
          <div className="my-2 h-px w-10 bg-primary-foreground/60 dark:bg-foreground/60" />
          <p className={cn("opacity-90", size === "lg" ? "text-base" : "text-xs")}>{author}</p>
        </div>
      </div>
    </div>
  );
}
