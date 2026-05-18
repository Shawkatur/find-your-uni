"use client";

import { useTranslation } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "bn" : "en")}
      className="px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
      title={locale === "en" ? "বাংলায় দেখুন" : "Switch to English"}
    >
      {locale === "en" ? "বাং" : "EN"}
    </button>
  );
}
