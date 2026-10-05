import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Download, FileText, LogOut, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/account")({
  validateSearch: (s: Record<string, unknown>): { order?: string } => ({ order: typeof s.order === "string" ? s.order : undefined }),
  head: () => ({
    meta: [
      { title: "حسابي — Kova" },
      { name: "description", content: "ملفك الشخصي وطلباتك وفواتيرك وروابط التحميل." },
      { property: "og:title", content: "حسابي — Kova" },
      { property: "og:description", content: "لوحة العميل في Kova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

type Order = { id: string; created_at: string; total: number; status: string; customer_name: string | null; order_items: { id: string; title: string; price: number; quantity: number; product_id: string | null }[] };

function Account() {
  const { user } = Route.useRouteContext();
  const { order: highlight } = Route.useSearch();
  const { format } = useStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [invoice, setInvoice] = useState<string | null>(highlight ?? null);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  useEffect(() => { if (profile.data?.display_name) setName(profile.data.display_name); }, [profile.data]);

  const orders = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
  });

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim().slice(0, 60) });
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم حفظ الملف الشخصي");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const download = (title: string, orderId: string) => {
    const text = `${title}\n\nنسخة رقمية مرخّصة لـ ${user.email}\nرقم الطلب: ${orderId}\n\n— Kova —\n\nشكراً لقراءتك. هذه النسخة مخصّصة لاستخدامك الشخصي فقط.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const purchased = (orders.data ?? []).flatMap((o) => o.order_items.map((i) => ({ ...i, orderId: o.id })));
  const inv = orders.data?.find((o) => o.id === invoice);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">مرحباً، {profile.data?.display_name ?? ""}</h1>
        <Button variant="outline" className="rounded-full" onClick={signOut}><LogOut className="h-4 w-4" /> تسجيل الخروج</Button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="glass h-fit space-y-3 rounded-2xl p-5">
          <h2 className="font-bold">الملف الشخصي</h2>
          <div className="text-sm text-muted-foreground" dir="ltr">{user.email}</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم المعروض" />
          <Button onClick={saveProfile} className="w-full">حفظ</Button>
          <div className="grid grid-cols-2 gap-2 pt-2 text-center">
            <div className="rounded-xl bg-secondary p-3"><div className="text-2xl font-bold">{orders.data?.length ?? 0}</div><div className="text-xs text-muted-foreground">طلبات</div></div>
            <div className="rounded-xl bg-secondary p-3"><div className="text-2xl font-bold">{purchased.length}</div><div className="text-xs text-muted-foreground">عناوين</div></div>
          </div>
        </div>
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-bold">مكتبتي الرقمية</h2>
            {purchased.length === 0 ? <p className="text-muted-foreground">لم تشترِ أي عنوان بعد.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {purchased.map((i) => (
                  <div key={i.id} className="glass flex items-center justify-between rounded-xl p-4">
                    <span className="font-medium">{i.title}</span>
                    <Button size="sm" variant="secondary" onClick={() => download(i.title, i.orderId)}><Download className="h-4 w-4" /> تحميل</Button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold">سجل الطلبات</h2>
            <div className="space-y-3">
              {(orders.data ?? []).map((o) => (
                <div key={o.id} className={`glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${o.id === highlight ? "ring-2 ring-accent" : ""}`}>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-sm">{new Date(o.created_at).toLocaleString("ar")} · {o.order_items.length} عنوان</div>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">{o.status === "paid" ? "مدفوع" : o.status === "refunded" ? "مسترد" : o.status}</span>
                  <span className="font-bold">{format(Number(o.total))}</span>
                  <Button size="sm" variant="ghost" onClick={() => setInvoice(o.id)}><FileText className="h-4 w-4" /> الفاتورة</Button>
                </div>
              ))}
            </div>
          </section>
          {inv && (
            <section className="rounded-2xl border bg-card p-6" id="invoice">
              <div className="flex items-center justify-between">
                <div><div className="font-display text-2xl font-extrabold">Kova<span className="text-accent">.</span></div><div className="text-sm text-muted-foreground">فاتورة ضريبية مبسطة</div></div>
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
              </div>
              <div className="mt-4 grid gap-1 text-sm">
                <div>رقم الفاتورة: <span className="font-mono">{inv.id.slice(0, 8).toUpperCase()}</span></div>
                <div>التاريخ: {new Date(inv.created_at).toLocaleDateString("ar")}</div>
                <div>العميل: {inv.customer_name ?? user.email}</div>
              </div>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="py-2 text-right">العنوان</th><th>الكمية</th><th className="text-left">المبلغ</th></tr></thead>
                <tbody>{inv.order_items.map((i) => <tr key={i.id} className="border-b"><td className="py-2">{i.title}</td><td className="text-center">{i.quantity}</td><td className="text-left">{format(Number(i.price) * i.quantity)}</td></tr>)}</tbody>
              </table>
              <div className="mt-4 flex justify-between text-lg font-bold"><span>الإجمالي</span><span>{format(Number(inv.total))}</span></div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
