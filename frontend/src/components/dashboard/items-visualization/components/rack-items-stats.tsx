import type { Rack } from "../../types"

interface RackItemsStatsProps {
  rack: Rack
  occupiedSlots: number
}

export function RackItemsStats({ rack, occupiedSlots }: RackItemsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Zajęte miejsca</p>
        <p className="font-semibold text-2xl">
          {occupiedSlots} / {rack.rows * rack.cols}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Obciążenie</p>
        <p className="font-semibold text-2xl">
          {rack.currentWeight.toFixed(0)} / {rack.maxWeight} kg
        </p>
      </div>
    </div>
  )
}
