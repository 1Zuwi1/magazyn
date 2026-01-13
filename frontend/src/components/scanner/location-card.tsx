"use client"

import { useTranslations } from "next-intl"
import type { Location } from "./scanner-types"

interface LocationCardProps {
  location: Location
  index: number
}

export function LocationCard({ location, index }: LocationCardProps) {
  const t = useTranslations("scanner")
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-primary">{index + 1}</span>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-bold text-lg">{location.rack}</div>
            <div className="text-muted-foreground text-xs">
              {t("location.rack")}
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <div className="font-bold text-lg">{location.row}</div>
            <div className="text-muted-foreground text-xs">
              {t("location.row")}
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <div className="font-bold text-lg">{location.col}</div>
            <div className="text-muted-foreground text-xs">
              {t("location.col")}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
