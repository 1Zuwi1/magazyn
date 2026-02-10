import { translateMessage } from "@/i18n/translate-message"
import type { Rack } from "@/lib/schemas"

interface RackItemsStatsProps {
  rack: Rack
  occupiedSlots: number
}

export function RackItemsStats({ rack, occupiedSlots }: RackItemsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0484")}
        </p>
        <p className="font-semibold text-2xl">
          {occupiedSlots} / {rack.sizeY * rack.sizeX}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0485")}
        </p>
        <p className="font-semibold text-2xl">
          {translateMessage("generated.m0954")}
        </p>
      </div>
    </div>
  )
}
