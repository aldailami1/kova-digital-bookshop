import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string } } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Authorize app — Kova" },
      { name: "description", content: "Approve or deny an app's access to your Kova account." },
      { property: "og:title", content: "Authorize app — Kova" },
      { property: "og:description", content: "Approve or deny an app's access to your Kova account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization request.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">This request can't be loaded</h1>
      <p className="mt-2 text-muted-foreground">{error.message || "It may have expired. Start the connection again."}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "An app";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect was returned. Please try again."); return; }
    window.location.href = target;
  }

  return (
    <main className="hero-glow -mt-20 flex min-h-[85vh] items-center justify-center px-4 pt-24">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <h1 className="font-display text-3xl font-bold">Connect {name} to Kova</h1>
        <p className="mt-3 text-muted-foreground">{name} will be able to browse the catalog and read your orders as you.</p>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={() => decide(false)}>Deny</Button>
          <Button className="rounded-full" disabled={busy} onClick={() => decide(true)}>Approve</Button>
        </div>
      </div>
    </main>
  );
}
