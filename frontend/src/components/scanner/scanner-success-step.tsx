"use client"

import { Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Button } from "../ui/button"

interface ScannerSuccessStepProps {
  onReset: () => void
}

export function ScannerSuccessStep({ onReset }: ScannerSuccessStepProps) {
  const t = useTranslations("scanner")
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
        <HugeiconsIcon className="size-8" icon={Tick02Icon} />
      </div>
      <h2 className="mb-2 font-semibold text-xl">{t("success.title")}</h2>
      <p className="text-muted-foreground">{t("success.subtitle")}</p>
      <Button className="mt-6" onClick={onReset} type="button">
        {t("success.action")}
      </Button>
    </div>
  )
}
