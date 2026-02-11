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
        "flex items-center gap-2.5 rounded-lg border px-3.5 py-2 shadow-xs backdrop-blur-sm transition-colors",
        className
      )}
    >
      <HugeiconsIcon className="size-3.5 shrink-0" icon={icon} />
      <span className="font-mono font-semibold tabular-nums">{count}</span>
      <span className="text-xs leading-tight">{label}</span>
    </div>
  )
}
