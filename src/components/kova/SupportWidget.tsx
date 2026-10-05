import { useState } from "react";
import { CheckCircle2, Headphones, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function SupportWidget() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-5 right-5 z-40 h-13 w-13 rounded-full shadow-soft" aria-label="Open customer support"><MessageCircle className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent className="glass flex w-[min(92vw,400px)] flex-col border-glass-border p-0" side="right">
        <SheetHeader className="border-b p-6 text-left">
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Headphones className="h-5 w-5" /></div>
          <SheetTitle className="font-display text-2xl">Kova Support</SheetTitle>
          <SheetDescription>Tell us what you need. This preview simulates a support request without sending personal data.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-semibold">Popular questions</p>
            <ul className="mt-2 space-y-2 text-muted-foreground"><li>Where is my digital download?</li><li>How do I view an invoice?</li><li>Can I change my order?</li></ul>
          </div>
          {sent ? (
            <div className="rounded-lg border bg-card p-5 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-accent" /><p className="mt-3 font-semibold">Message received</p><p className="mt-1 text-sm text-muted-foreground">A support specialist would reply here in a connected production service.</p><Button variant="outline" className="mt-4" onClick={() => setSent(false)}>Send another</Button></div>
          ) : (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (message.trim()) setSent(true); }}>
              <Input type="email" aria-label="Support email" placeholder="Email address" required />
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How can we help?" minLength={4} required className="min-h-32" />
              <Button type="submit" className="w-full"><Send className="h-4 w-4" />Send message</Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}