"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { type Locale, locales } from "@/i18n/routing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const LOCALE_ENDPOINT = "/api/locale"

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations("languageSwitcher")
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const languageLabels: Record<Locale, string> = {
    en: t("english"),
    pl: t("polish"),
  }

  const updateLocale = async (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return
    }

    setIsUpdating(true)
    try {
      await fetch(LOCALE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      })
    } finally {
      setIsUpdating(false)
      router.refresh()
    }
  }

  const handleChange = (nextLocale: Locale | null) => {
    if (!nextLocale || nextLocale === locale) {
      return
    }
    updateLocale(nextLocale)
  }

  return (
    <Select disabled={isUpdating} onValueChange={handleChange} value={locale}>
      <SelectTrigger aria-label={t("label")} className="w-[120px]" size="sm">
        <SelectValue />
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
