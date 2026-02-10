"use client"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { formatDistanceToNow } from "date-fns"
import { useLocale } from "next-intl"
import { useMemo } from "react"
import { InsightCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useAssortments from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import useWarehouses from "@/hooks/use-warehouses"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { translateMessage } from "@/i18n/translate-message"
import {
  EXPIRING_ITEMS_LIMIT,
  EXPIRY_WARNING_DAYS,
  formatNumber,
  OCCUPANCY_CRITICAL_THRESHOLD,
  RECENT_ITEMS_LIMIT,
} from "./dashboard-home.constants"

function OperationalAlertsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2"
            key={`alert-skeleton-${i.toString()}`}
          >
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: 3 }, (_, i) => (
          <div
            className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2"
            key={`expiry-skeleton-${i.toString()}`}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardOperationalAlertsCard() {
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const {
    data: criticalWarehousesData,
    isPending: isCriticalWarehousesPending,
    isError: isCriticalWarehousesError,
    refetch: refetchCriticalWarehouses,
  } = useWarehouses({
    minPercentOfOccupiedSlots: OCCUPANCY_CRITICAL_THRESHOLD,
    size: 1,
    page: 0,
  })

  const {
    data: expiringSoonItemsData,
    isPending: isExpiringPending,
    isError: isExpiringError,
    refetch: refetchExpiring,
  } = useAssortments({
    page: 0,
    size: EXPIRING_ITEMS_LIMIT,
    sortBy: "expiresAt",
    sortDir: "asc",
    weekToExpire: true,
  })

  const {
    data: assortmentsData,
    isPending: isAssortmentsPending,
    isError: isAssortmentsError,
    refetch: refetchAssortments,
  } = useAssortments({
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

  const isPending =
    isCriticalWarehousesPending || isExpiringPending || isAssortmentsPending
  const isError =
    isCriticalWarehousesError || isExpiringError || isAssortmentsError

  const handleRetry = () => {
    if (isCriticalWarehousesError) {
      refetchCriticalWarehouses()
    }
    if (isExpiringError) {
      refetchExpiring()
    }
    if (isAssortmentsError) {
      refetchAssortments()
    }
  }

  const renderContent = () => {
    if (isPending) {
      return <OperationalAlertsSkeleton />
    }

    if (isError) {
      return <ErrorEmptyState onRetry={handleRetry} />
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
            <span>
              {translateMessage("generated.m1075", {
                value0: OCCUPANCY_CRITICAL_THRESHOLD,
              })}
            </span>
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
            <span>
              {translateMessage("generated.m1076", {
                value0: EXPIRY_WARNING_DAYS,
              })}
            </span>
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
            <span>{translateMessage("generated.m0444")}</span>
            <Badge variant={dangerousItemsCount > 0 ? "warning" : "success"}>
              {formatNumber(dangerousItemsCount)}
            </Badge>
          </div>
        </div>

        {expiringSoonItems.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              {translateMessage("generated.m0445")}
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
                    {formatDistanceToNow(new Date(item.expiresAt), {
                      locale: dateFnsLocale,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {translateMessage("generated.m0446")}
          </p>
        )}

        {(criticalWarehousesData?.totalElements ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              {translateMessage("generated.m0447")}
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
    )
  }

  return (
    <InsightCard
      description={translateMessage("generated.m0448")}
      icon={AlertCircleIcon}
      title={translateMessage("generated.m0449")}
    >
      {renderContent()}
    </InsightCard>
  )
}
