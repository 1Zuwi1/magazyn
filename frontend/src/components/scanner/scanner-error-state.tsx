"use client"

import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Button } from "../ui/button"

interface ScannerErrorStateProps {
  error: string
  onRetry: () => void
}

export function ScannerErrorState({ error, onRetry }: ScannerErrorStateProps) {
  const t = useTranslations("scanner")
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
        <HugeiconsIcon className="size-8" icon={Cancel01Icon} />
      </div>
      <h2 className="mb-2 font-semibold text-xl">{t("errors.title")}</h2>
      <p className="text-muted-foreground">{error}</p>
      <Button className="mt-6" onClick={onRetry} type="button">
        {t("actions.retry")}
      </Button>
    </div>
  )
}
