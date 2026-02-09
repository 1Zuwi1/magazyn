import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"

export interface StatBadgeConfig {
  icon: IconSvgElement
  count: number
  label: string
  className?: string
}

export function StatBadge({
  icon,
  count,
  label,
  className = "",
}: StatBadgeConfig) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 backdrop-blur-sm",
        className
      )}
    >
      <HugeiconsIcon className="size-3.5" icon={icon} />
      <span className="font-mono font-semibold">{count}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}
