import {
  Analytics01Icon,
  CheckmarkCircle02Icon,
  PackageIcon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface RackStatusCardProps {
  occupiedSlots: number
  freeSlots: number
  totalCapacity: number
  occupancyPercentage: number
}

function getOccupancyColor(percentage: number): {
  text: string
  bg: string
  bar: string
  label: string
} {
  if (percentage >= 90) {
    return {
      text: "text-destructive",
      bg: "bg-destructive/10",
      bar: "bg-destructive",
      label: "Krytyczne",
    }
  }
  if (percentage >= 75) {
    return {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      bar: "bg-orange-500",
      label: "Wysokie",
    }
  }
  if (percentage >= 50) {
    return {
      text: "text-primary",
      bg: "bg-primary/10",
      bar: "bg-primary",
      label: "Umiarkowane",
    }
  }
  return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
    label: "Niskie",
  }
}

export function RackStatusCard({
  occupiedSlots,
  freeSlots,
  totalCapacity,
  occupancyPercentage,
}: RackStatusCardProps) {
  const occupancyColors = getOccupancyColor(occupancyPercentage)

  const stats = [
    {
      icon: SquareLock02Icon,
      label: "Zajęte",
      value: occupiedSlots,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      icon: CheckmarkCircle02Icon,
      label: "Wolne",
      value: freeSlots,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: PackageIcon,
      label: "Pojemność",
      value: totalCapacity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <HugeiconsIcon
            className="size-4 text-primary"
            icon={Analytics01Icon}
          />
        </div>
        <h3 className="font-semibold text-sm">Status regału</h3>
      </div>

      {/* Occupancy Gauge */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Obłożenie</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-medium text-xs",
                occupancyColors.bg,
                occupancyColors.text
              )}
            >
              {occupancyColors.label}
            </span>
          </div>
          <span
            className={cn("font-bold font-mono text-2xl", occupancyColors.text)}
          >
            {occupancyPercentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              occupancyColors.bar
            )}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>

        {/* Progress markers */}
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x">
        {stats.map((stat, index) => (
          <div
            className="flex flex-col items-center gap-1 px-3 py-4 transition-colors hover:bg-muted/20"
            key={index}
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                stat.bgColor
              )}
            >
              <HugeiconsIcon
                className={cn("size-4", stat.color)}
                icon={stat.icon}
              />
            </div>
            <span className="font-bold font-mono text-lg">{stat.value}</span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
