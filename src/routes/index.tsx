import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Download, Globe2, Sparkles } from "lucide-react";
import { fetchProducts } from "@/lib/data";
import { ProductCard } from "@/components/kova/ProductCard";
import { BookCover } from "@/components/kova/BookCover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kova — متجر عربي عالمي للكتب والقصص" },
      { name: "description", content: "اكتشف أجمل الروايات والقصص العربية، واشترِ نسخك الرقمية والمطبوعة بسهولة من Kova." },
      { property: "og:title", content: "Kova — متجر الكتب والقصص" },
      { property: "og:description", content: "روايات، تاريخ، فلسفة، وقصص للأطفال — كلها في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Grid({ title, link, items, loading }: { title: string; link: React.ReactNode; items: ReturnType<typeof useProducts>["data"]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-20">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        {link}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-lg" />)
          : items?.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts });
}

function Index() {
  const { data, isLoading } = useProducts();
  const { format } = useStore();
  const all = data ?? [];
  const featured = all.filter((p) => p.is_featured);
  const hero = featured.slice(0, 3);
  const latest = [...all].sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 5);
  const best = [...all].sort((a, b) => b.sales_count - a.sales_count).slice(0, 5);
  const deal = best[0];

  return (
    <>
      <section className="hero-glow relative -mt-20 overflow-hidden pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 md:grid-cols-2">
          <div className="rise">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> أكثر من ١٨ عنواناً جديداً هذا الشهر
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
              كل حكاية تبدأ<br />بصفحة <span className="text-accent">واحدة.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Kova يجمع لك أجمل الكتب والقصص العربية — من كلاسيكيات الأدب إلى حكايات ما قبل النوم — بنسخ رقمية فورية.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" asChild>
                <Link to="/catalog" search={{ kind: "book" }}>تصفّح الكتب <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="glass rounded-full" asChild>
                <Link to="/catalog" search={{ kind: "story" }}>عالم القصص</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto h-[360px] w-full max-w-md md:h-[460px]">
            {hero.map((p, i) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="rise absolute w-40 transition-transform duration-500 hover:z-10 hover:-translate-y-3 md:w-52"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  right: `${i * 26}%`,
                  top: `${[10, 0, 14][i]}%`,
                  transform: `rotate(${[-6, 2, 8][i]}deg)`,
                }}
              >
                <BookCover title={p.title} author={p.author} hue={p.cover_hue} kind={p.kind} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3">
        {[
          { icon: Download, t: "تحميل فوري", d: "نسخك الرقمية جاهزة فور الدفع" },
          { icon: Globe2, t: "شحن عالمي وعملات متعددة", d: "ادفع بالدولار أو الريال أو الدرهم أو الجنيه" },
          { icon: BookOpen, t: "مختارات منتقاة", d: "عناوين يختارها محررون قرّاء" },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="glass flex items-center gap-4 rounded-2xl p-5">
            <I className="h-6 w-6 shrink-0 text-accent" />
            <div><div className="font-semibold">{t}</div><div className="text-sm text-muted-foreground">{d}</div></div>
          </div>
        ))}
      </section>

      <Grid
        title="أحدث الإصدارات"
        loading={isLoading}
        items={latest}
        link={<Link to="/catalog" search={{ sort: "new" }} className="text-sm text-accent">عرض الكل ←</Link>}
      />

      {deal && (
        <section className="mx-auto max-w-7xl px-4 pt-20">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:p-12">
            <div className="hero-glow absolute inset-0 opacity-60" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">عرض الأسبوع</span>
                <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">{deal.title}</h2>
                <p className="mt-2 opacity-80">{deal.author} — الأكثر مبيعاً في Kova</p>
                <p className="mt-4 max-w-lg opacity-90">{deal.description}</p>
                <Button variant="secondary" className="mt-6 rounded-full" asChild>
                  <Link to="/product/$slug" params={{ slug: deal.slug }}>اشترِ الآن بـ {format(Number(deal.price))}</Link>
                </Button>
              </div>
              <div className="mx-auto w-44 rotate-3"><BookCover title={deal.title} author={deal.author} hue={deal.cover_hue} /></div>
            </div>
          </div>
        </section>
      )}

      <Grid
        title="الأكثر مبيعاً"
        loading={isLoading}
        items={best}
        link={<Link to="/catalog" search={{ sort: "best" }} className="text-sm text-accent">عرض الكل ←</Link>}
      />
      <Grid
        title="مختارات المحررين"
        loading={isLoading}
        items={featured.slice(0, 10)}
        link={<Link to="/catalog" className="text-sm text-accent">الكتالوج ←</Link>}
      />
    </>
  );
}
