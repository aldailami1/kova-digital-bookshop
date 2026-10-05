import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = { product_id: string; slug: string; title: string; author: string; price: number; cover_hue: number; quantity: number };
export type Currency = "USD" | "SAR" | "AED" | "EGP";
export const CURRENCIES: Record<Currency, { rate: number; label: string }> = {
  USD: { rate: 1, label: "دولار" },
  SAR: { rate: 3.75, label: "ريال" },
  AED: { rate: 3.67, label: "درهم" },
  EGP: { rate: 48.5, label: "جنيه" },
};

type Store = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (usd: number) => string;
  dark: boolean;
  toggleDark: () => void;
  user: User | null;
  isAdmin: boolean;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kova-cart");
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      const c = localStorage.getItem("kova-currency") as Currency | null;
      if (c && c in CURRENCIES) setCurrencyState(c);
      const d = localStorage.getItem("kova-dark");
      const isDark = d ? d === "1" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(isDark);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("kova-cart", JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (ready) localStorage.setItem("kova-dark", dark ? "1" : "0");
  }, [dark, ready]);

  useEffect(() => {
    const load = async (u: User | null) => {
      setUser(u);
      if (!u) return setIsAdmin(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const add: Store["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const ex = prev.find((p) => p.product_id === item.product_id);
      if (ex) return prev.map((p) => (p.product_id === item.product_id ? { ...p, quantity: Math.min(20, p.quantity + qty) } : p));
      return [...prev, { ...item, quantity: qty }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((p) => (p.product_id === id ? { ...p, quantity: Math.max(1, Math.min(20, qty)) } : p)));
  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.product_id !== id));
  const clear = () => setItems([]);
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("kova-currency", c);
  };
  const format = (usd: number) =>
    new Intl.NumberFormat("ar", { style: "currency", currency, maximumFractionDigits: 2 }).format(usd * CURRENCIES[currency].rate);

  return (
    <Ctx.Provider
      value={{
        items, add, setQty, remove, clear,
        count: items.reduce((s, i) => s + i.quantity, 0),
        subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
        currency, setCurrency, format,
        dark, toggleDark: () => setDark((d) => !d),
        user, isAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
