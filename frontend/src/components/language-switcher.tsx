"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import type { AppLocale } from "@/i18n/locale"
import { usePathname, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const LANGUAGES: { locale: AppLocale; label: string; flag: string }[] = [
  { locale: "pl", label: "PL", flag: "\u{1F1F5}\u{1F1F1}" },
  { locale: "en", label: "EN", flag: "\u{1F1EC}\u{1F1E7}" },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations()

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = params.locale as AppLocale

  const handleLocaleChange = (nextLocale: AppLocale): void => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      )
      router.refresh()
    })
  }

  const activeIndex = LANGUAGES.findIndex((l) => l.locale === currentLocale)

  return (
    <nav
      aria-label={t("selectLanguage")}
      className={cn(
        "relative inline-flex h-8 items-center gap-0 rounded-full border border-border/60 bg-muted/40 p-0.5 backdrop-blur-sm",
        {
          "transition-opacity disabled:opacity-30": isPending,
        },
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
            aria-label={t(
              locale === "pl"
                ? "generated.global.language.polish"
                : "generated.global.language.english"
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
