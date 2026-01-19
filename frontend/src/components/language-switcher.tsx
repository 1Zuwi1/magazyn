"use client"

import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { LOCALE_COOKIE_NAME } from "@/config/constants"
import { type Locale, locales } from "@/i18n/routing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations("languageSwitcher")
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const hasSyncedStoredLocale = useRef(false)

  const languageLabels: Record<Locale, string> = {
    en: t("english"),
    pl: t("polish"),
  }

  const updateLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) {
        return
      }

      setIsUpdating(true)
      let err = false
      try {
        Cookies.set(LOCALE_COOKIE_NAME, nextLocale, {
          expires: 365, // 1 year
        })
      } catch {
        err = true
      } finally {
        if (!err) {
          router.refresh()
        }
        setIsUpdating(false)
      }
    },
    [locale, router]
  )

  useEffect(() => {
    const storedLocale = Cookies.get(LOCALE_COOKIE_NAME) as Locale | undefined
    if (
      storedLocale &&
      locales.includes(storedLocale) &&
      storedLocale !== locale &&
      !hasSyncedStoredLocale.current
    ) {
      hasSyncedStoredLocale.current = true
      updateLocale(storedLocale)
    }
  }, [locale, updateLocale])

  const handleChange = (nextLocale: Locale | null) => {
    if (!nextLocale || nextLocale === locale) {
      return
    }
    updateLocale(nextLocale)
  }

  return (
    <Select disabled={isUpdating} onValueChange={handleChange} value={locale}>
      <SelectTrigger aria-label={t("label")} className="w-30" size="sm">
        <SelectValue render={<span>{languageLabels[locale]}</span>} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((option) => (
          <SelectItem key={option} value={option}>
            {languageLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
