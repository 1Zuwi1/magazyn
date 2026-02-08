"use client"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"
import { InsightCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import useAssortments from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import useWarehouses from "@/hooks/use-warehouses"
import {
  EXPIRING_ITEMS_LIMIT,
  EXPIRY_WARNING_DAYS,
  formatNumber,
  OCCUPANCY_CRITICAL_THRESHOLD,
  RECENT_ITEMS_LIMIT,
} from "./dashboard-home.constants"

export function DashboardOperationalAlertsCard() {
  const { data: criticalWarehousesData } = useWarehouses({
    minPercentOfOccupiedSlots: OCCUPANCY_CRITICAL_THRESHOLD,
    size: 1,
    page: 0,
  })

  const { data: expiringSoonItemsData } = useAssortments({
    page: 0,
    size: EXPIRING_ITEMS_LIMIT,
    sortBy: "expiresAt",
    sortDir: "asc",
    weekToExpire: true,
  })

  const { data: assortmentsData } = useAssortments({
    page: 0,
    size: RECENT_ITEMS_LIMIT,
    sortBy: "createdAt",
    sortDir: "desc",
  })

  const assortments = assortmentsData?.content ?? []
  const expiringSoonItems = expiringSoonItemsData?.content ?? []

  const assortmentItemIds = useMemo(
    () => [...new Set(assortments.map((item) => item.itemId))],
    [assortments]
  )

  const itemDefinitionQueries = useMultipleItems({
    itemIds: assortmentItemIds,
  })

  const itemDefinitionsById = useMemo(() => {
    const itemDefinitionsMap = new Map<
      number,
      NonNullable<(typeof itemDefinitionQueries)[number]["data"]>
    >()

    for (const query of itemDefinitionQueries) {
      if (query.data) {
        itemDefinitionsMap.set(query.data.id, query.data)
      }
    }

    return itemDefinitionsMap
  }, [itemDefinitionQueries])

  const dangerousItemsCount = useMemo(() => {
    let dangerousCount = 0
    for (const assortment of assortments) {
      if (itemDefinitionsById.get(assortment.itemId)?.dangerous) {
        dangerousCount += 1
      }
    }
    return dangerousCount
  }, [assortments, itemDefinitionsById])

  return (
    <InsightCard
      description="Zestawienie ryzyk wymagających uwagi."
      icon={AlertCircleIcon}
      title="Alerty operacyjne"
    >
      <div className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
            <span>Magazyny powyżej {OCCUPANCY_CRITICAL_THRESHOLD}%</span>
            <Badge
              variant={
                (criticalWarehousesData?.totalElements ?? 0) > 0
                  ? "destructive"
                  : "success"
              }
            >
              {formatNumber(criticalWarehousesData?.totalElements ?? 0)}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
            <span>Produkty z terminem poniżej {EXPIRY_WARNING_DAYS} dni</span>
            <Badge
              variant={
                (expiringSoonItemsData?.totalElements ?? 0) > 0
                  ? "warning"
                  : "success"
              }
            >
              {formatNumber(expiringSoonItemsData?.totalElements ?? 0)}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
            <span>Produkty niebezpieczne</span>
            <Badge variant={dangerousItemsCount > 0 ? "warning" : "success"}>
              {formatNumber(dangerousItemsCount)}
            </Badge>
          </div>
        </div>

        {expiringSoonItems.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Najbliższe terminy
            </p>
            <ul className="space-y-2 text-sm">
              {expiringSoonItems.map((item) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2"
                  key={item.id}
                >
                  <span className="truncate">
                    {itemDefinitionsById.get(item.itemId)?.name}
                  </span>
                  <span className="shrink-0 font-mono text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.expiresAt))} dni
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Brak produktów z krótką datą ważności.
          </p>
        )}

        {(criticalWarehousesData?.totalElements ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Krytyczne lokalizacje
            </p>
            <div className="flex flex-wrap gap-2">
              {criticalWarehousesData?.content.map((warehouse) => (
                <Badge key={warehouse.id} variant="destructive">
                  {warehouse.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </InsightCard>
  )
}
