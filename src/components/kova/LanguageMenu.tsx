import { Globe2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export function LanguageMenu() {
  const translate = (code: string) => {
    if (code === "en") return;
    const currentUrl = window.location.href;
    const url = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Select defaultValue="en" onValueChange={translate}>
      <SelectTrigger className="h-9 w-28 rounded-full bg-background/60" aria-label="Translate Kova">
        <Globe2 className="h-4 w-4 shrink-0" /><SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => <SelectItem key={language.code} value={language.code}>{language.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}