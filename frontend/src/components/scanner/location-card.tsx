import { cn } from "@/lib/utils"
import type { Location } from "./scanner-types"

interface LocationCardProps {
  location: Location
  index: number
}

export function LocationCard({ location, index }: LocationCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-center gap-4 p-4">
        {/* Index badge */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold font-mono text-primary">
          {index + 1}
        </div>

        {/* Location details */}
        <div className="flex flex-1 items-center gap-4">
          <LocationDetail label="Regał" value={location.rack} />
          <div className="h-8 w-px bg-border" />
          <LocationDetail label="Rząd" value={location.row} />
          <div className="h-8 w-px bg-border" />
          <LocationDetail label="Kolumna" value={location.col} />
        </div>
      </div>
    </div>
  )
}

function LocationDetail({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className={cn("text-center", className)}>
      <div className="font-bold font-mono text-lg">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}
