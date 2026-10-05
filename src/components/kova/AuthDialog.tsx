import { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; initialMode?: "in" | "up" };

export function AuthDialog({ open, onOpenChange, initialMode = "in" }: Props) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (result.error) {
      toast.error(mode === "in" ? "We couldn’t sign you in. Check your details and try again." : result.error.message);
      return;
    }
    if (mode === "up" && !result.data.session) {
      toast.success("Check your inbox to confirm your account.");
      return;
    }
    toast.success(mode === "in" ? "Welcome back." : "Your account is ready.");
    onOpenChange(false);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Google sign-in is unavailable right now.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md border-glass-border p-7 sm:rounded-2xl">
        <DialogHeader className="text-left">
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><LogIn className="h-5 w-5" /></div>
          <DialogTitle className="font-display text-2xl">{mode === "in" ? "Welcome back" : "Create your Kova account"}</DialogTitle>
          <DialogDescription>{mode === "in" ? "Access your library, orders, and downloads." : "One account for purchases, reviews, and your digital library."}</DialogDescription>
        </DialogHeader>
        <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="auth-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-email" type="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
          <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <Button type="button" variant="link" className="w-full" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New to Kova? Create an account" : "Already have an account? Sign in"}</Button>
      </DialogContent>
    </Dialog>
  );
}