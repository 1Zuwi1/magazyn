"use client"

import { useTranslations } from "next-intl"
import type { Rack } from "../types"

interface RackItemsStatsProps {
  rack: Rack
  occupiedSlots: number
}

export function RackItemsStats({ rack, occupiedSlots }: RackItemsStatsProps) {
  const t = useTranslations("rackItemsTable")
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{t("stats.occupied")}</p>
        <p className="font-semibold text-2xl">
          {occupiedSlots} / {rack.rows * rack.cols}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{t("stats.load")}</p>
        <p className="font-semibold text-2xl">
          {t("stats.loadValue", {
            current: rack.currentWeight.toFixed(0),
            max: String(rack.maxWeight),
          })}
        </p>
      </div>
    </div>
  )
}
