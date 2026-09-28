"use client"

import * as React from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, toggleLocale, dict } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-foreground/60 opacity-50">
        <Globe className="w-4 h-4" />
      </div>
    );
  }

  const isArabic = locale === "ar";

  return (
    <button
      onClick={toggleLocale}
      className="min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-muted border border-border/60 transition-all select-none focus:outline-none focus:ring-2 focus:ring-primary/40"
      aria-label={dict.common.switchLanguage}
      title={dict.common.switchLanguage}
    >
      <Globe className="w-4 h-4 text-primary shrink-0" />
      <span className="font-semibold">{isArabic ? "English" : "العربية"}</span>
    </button>
  );
}
