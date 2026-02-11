import { Loading02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

function Spinner({
  className,
  strokeWidth,
  ...props
}: React.ComponentProps<"svg">) {
  const t = useTranslations()

  return (
    <HugeiconsIcon
      aria-label={t("generated.ui.landing")}
      className={cn("size-4 animate-spin fill-current", className)}
      icon={Loading02Icon}
      role="status"
      strokeWidth={Number.parseInt(strokeWidth?.toString() ?? "0", 10)}
      {...props}
    />
  )
}

export { Spinner }
