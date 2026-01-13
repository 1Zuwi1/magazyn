import { Loading02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

function Spinner({
  className,
  strokeWidth,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <HugeiconsIcon
      aria-label="Loading"
      className={cn("size-6 animate-spin fill-current", className)}
      icon={Loading02Icon}
      role="status"
      strokeWidth={Number.parseFloat(strokeWidth?.toString() || "2")}
      {...props}
    />
  )
}

export { Spinner }
