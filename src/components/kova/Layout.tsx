import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Moon, Search, ShoppingBag, Sun, User, Menu, X, LayoutDashboard } from "lucide-react";
import { useStore, CURRENCIES, type Currency } from "@/lib/store";
import { Button } from "@/components/ui/button";

function Navbar() {
  const { count, dark, toggleDark, user, isAdmin, currency, setCurrency } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/catalog", search: { q: q.trim() || undefined } });
    setOpen(false);
  };
  const links = (
    <>
      <Link to="/catalog" search={{ kind: "book" }} className="hover:text-accent">الكتب</Link>
      <Link to="/catalog" search={{ kind: "story" }} className="hover:text-accent">القصص</Link>
      <Link to="/catalog" search={{ sort: "new" }} className="hover:text-accent">جديدنا</Link>
      <Link to="/catalog" search={{ sort: "best" }} className="hover:text-accent">الأكثر مبيعاً</Link>
    </>
  );
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav className="glass mx-auto flex max-w-7xl items-center gap-3 rounded-2xl px-4 py-2.5 shadow-soft">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          Kova<span className="text-accent">.</span>
        </Link>
        <div className="hidden items-center gap-5 text-sm font-medium lg:flex">{links}</div>
        <form onSubmit={submit} className="relative mx-auto hidden w-full max-w-sm md:block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن كتاب، قصة أو مؤلف..."
            className="h-10 w-full rounded-full border bg-background/60 pr-9 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="mr-auto flex items-center gap-1 md:mr-0">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="h-9 rounded-full border bg-background/60 px-2 text-xs"
            aria-label="العملة"
          >
            {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="تبديل الوضع">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="icon" asChild aria-label="لوحة الإدارة">
              <Link to="/admin"><LayoutDashboard className="h-4 w-4" /></Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild aria-label="حسابي">
            <Link to={user ? "/account" : "/auth"}><User className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative" aria-label="السلة">
            <Link to="/cart">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="القائمة">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>
      {open && (
        <div className="glass mx-auto mt-2 flex max-w-7xl flex-col gap-3 rounded-2xl p-4 text-sm lg:hidden">
          <form onSubmit={submit}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث..." className="h-10 w-full rounded-full border bg-background/60 px-4" />
          </form>
          <div className="flex flex-wrap gap-4" onClick={() => setOpen(false)}>{links}</div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl font-extrabold">Kova<span className="text-accent">.</span></div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">متجر عربي عالمي للكتب والقصص الرقمية والمطبوعة. نوصل الحكاية إلى كل قارئ، أينما كان.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">تسوّق</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalog" search={{ kind: "book" }}>الكتب</Link></li>
            <li><Link to="/catalog" search={{ kind: "story" }}>القصص</Link></li>
            <li><Link to="/catalog" search={{ sort: "best" }}>الأكثر مبيعاً</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">حسابك</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/account">طلباتي وتحميلاتي</Link></li>
            <li><Link to="/cart">سلة الشراء</Link></li>
            <li><Link to="/auth">تسجيل الدخول</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Kova — جميع الحقوق محفوظة</div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
