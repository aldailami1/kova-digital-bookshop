import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure checkout — Kova" },
      { name: "description", content: "Complete your Kova order through a secure checkout experience." },
      { property: "og:title", content: "Secure checkout — Kova" },
      { property: "og:description", content: "Complete your order at Kova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, subtotal, format, user, clear, currency } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-bold">Sign in to continue</h1>
        <p className="mt-2 text-muted-foreground">Your orders and downloads stay securely connected to your account.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/auth" search={{ next: "/checkout" }}>Sign in or create an account</Link></Button>
      </div>
    );
  if (items.length === 0)
    return <div className="py-24 text-center"><p>Your bag is empty.</p><Link to="/catalog" className="text-accent">Browse the catalog</Link></div>;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Enter the name shown on the card."); return; }
    if (card.replace(/\s/g, "").length < 12) { toast.error("Enter a valid card number."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      _customer_name: name.trim(),
    });
    setBusy(false);
    if (error) { toast.error("We couldn’t complete your order."); return; }
    clear();
    toast.success("Payment complete. Your order is ready to download.");
    navigate({ to: "/account", search: { order: data as string } });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold"><Lock className="h-6 w-6 text-accent" /> Secure checkout</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <form onSubmit={pay} className="glass space-y-4 rounded-2xl p-6">
          <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" /> Card details</div>
          <div className="space-y-2"><Label>Name on card</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div className="space-y-2"><Label>Card number</Label><Input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Expiry date</Label><Input placeholder="MM/YY" maxLength={5} /></div>
            <div className="space-y-2"><Label>CVC</Label><Input dir="ltr" placeholder="123" maxLength={4} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Preview mode: no payment is charged. This checkout is ready for a live payment provider connection.</p>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>{busy ? "Processing…" : `Pay ${format(subtotal)}`}</Button>
        </form>
        <div className="glass h-fit space-y-3 rounded-2xl p-6">
          <h2 className="font-bold">Your order ({currency})</h2>
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm"><span>{i.title} × {i.quantity}</span><span>{format(i.price * i.quantity)}</span></div>
          ))}
          <div className="flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{format(subtotal)}</span></div>
        </div>
      </div>
    </div>
  );
}
