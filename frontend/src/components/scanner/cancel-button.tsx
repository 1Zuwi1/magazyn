import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Button } from "../ui/button"

interface CancelButtonProps {
  onClick: () => void
}

export function CancelButton({ onClick }: CancelButtonProps) {
  const t = useTranslations()

  return (
    <Button
      className="absolute top-0 right-0 rounded-xl"
      onClick={onClick}
      size="icon"
      type="button"
      variant="ghost"
    >
      <HugeiconsIcon className="size-5" icon={ArrowLeft02Icon} />
      <span className="sr-only">{t("generated.scanner.back")}</span>
    </Button>
  )
}
