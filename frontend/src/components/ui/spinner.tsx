import { Loading02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

function Spinner({
  className,
  strokeWidth,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <HugeiconsIcon
      aria-label={translateMessage("generated.m1046")}
      className={cn("size-4 animate-spin fill-current", className)}
      icon={Loading02Icon}
      role="status"
      strokeWidth={Number.parseInt(strokeWidth?.toString() ?? "0", 10)}
      {...props}
    />
  )
}

export { Spinner }
