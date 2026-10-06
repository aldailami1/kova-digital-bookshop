import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/kova/AuthDialog";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof s["next"] === "string" && s["next"].startsWith("/") && !s["next"].startsWith("//") ? s["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Kova" },
      { name: "description", content: "Sign in or create your Kova account." },
      { property: "og:title", content: "Sign in — Kova" },
      { property: "og:description", content: "Access your Kova orders, downloads, and reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const { user } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (user) navigate({ to: next ?? "/account", replace: true });
  }, [user, next, navigate]);

  return (
    <div className="hero-glow -mt-20 flex min-h-[85vh] items-center justify-center px-4 pt-24">
      <div className="max-w-md text-center"><h1 className="text-4xl font-extrabold">Your Kova library awaits.</h1><p className="mt-3 text-muted-foreground">Sign in to access your orders, reviews, invoices, and digital downloads.</p><Button className="mt-6 rounded-full" onClick={() => setOpen(true)}>Sign In / Sign Up</Button></div>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
