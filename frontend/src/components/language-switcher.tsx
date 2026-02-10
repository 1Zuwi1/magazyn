"use client"

import { useLocale } from "next-intl"
import { useCallback } from "react"
import {
  type AppLocale,
  createLocaleCookie,
  normalizeAppLocale,
} from "@/i18n/locale"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

const LANGUAGES: { locale: AppLocale; label: string; flag: string }[] = [
  { locale: "pl", label: "PL", flag: "\u{1F1F5}\u{1F1F1}" },
  { locale: "en", label: "EN", flag: "\u{1F1EC}\u{1F1E7}" },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const currentLocale = normalizeAppLocale(useLocale())

  const handleLocaleChange = useCallback(
    (nextLocale: AppLocale): void => {
      if (nextLocale === currentLocale) {
        return
      }

      // biome-ignore lint/suspicious/noDocumentCookie: Locale is persisted in a cookie to drive Next.js request locale on reload.
      document.cookie = createLocaleCookie(nextLocale)
      window.location.reload()
    },
    [currentLocale]
  )

  const activeIndex = LANGUAGES.findIndex((l) => l.locale === currentLocale)

  return (
    <nav
      aria-label="Select language"
      className={cn(
        "relative inline-flex h-8 items-center gap-0 rounded-full border border-border/60 bg-muted/40 p-0.5 backdrop-blur-sm",
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        aria-hidden="true"
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-background shadow-sm ring-1 ring-border/40 transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {LANGUAGES.map(({ locale, label, flag }) => {
        const isActive = locale === currentLocale
        return (
          <button
            aria-label={translateMessage(
              locale === "pl" ? "generated.m1161" : "generated.m1162"
            )}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium text-xs tracking-wide transition-colors duration-200",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            type="button"
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {flag}
            </span>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
