"use client"

import { PackageReceiveIcon } from "@hugeicons/core-free-icons"
import { formatDate } from "date-fns"
import { useMemo } from "react"
import { InsightCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useAssortments from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import { useMultipleRacks } from "@/hooks/use-racks"
import { translateMessage } from "@/i18n/translate-message"
import { RECENT_ITEMS_LIMIT } from "./dashboard-home.constants"

function RecentArrivalsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: RECENT_ITEMS_LIMIT }, (_, i) => (
        <div
          className="flex items-start justify-between gap-4 rounded-lg border bg-card/50 p-3"
          key={`arrival-skeleton-${i.toString()}`}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardRecentArrivalsCard() {
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

  const assortmentItemIds = useMemo(
    () => [...new Set(assortments.map((item) => item.itemId))],
    [assortments]
  )

  const recentAssortmentRackIds = useMemo(
    () => [...new Set(assortments.map((item) => item.rackId))],
    [assortments]
  )

  const itemDefinitionQueries = useMultipleItems({
    itemIds: assortmentItemIds,
  })
  const rackLookupQueries = useMultipleRacks({
    rackIds: recentAssortmentRackIds,
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

  const rackLabelsById = useMemo(() => {
    const rackLabelsMap = new Map<number, string>()

    for (const query of rackLookupQueries) {
      if (!query.data) {
        continue
      }

      rackLabelsMap.set(query.data.id, query.data.marker.trim())
    }

    return rackLabelsMap
  }, [rackLookupQueries])

  const recentAssortmentEntries = useMemo(
    () =>
      assortments.map((assortment) => {
        const itemDefinition = itemDefinitionsById.get(assortment.itemId)

        return {
          ...assortment,
          dangerous: itemDefinition?.dangerous ?? false,
          itemName:
            itemDefinition?.name ??
            translateMessage("generated.m1159", {
              value0: assortment.itemId,
            }),
          rackLabel:
            rackLabelsById.get(assortment.rackId) ??
            translateMessage("generated.m0450", { value0: assortment.rackId }),
        }
      }),
    [assortments, itemDefinitionsById, rackLabelsById]
  )

  const renderContent = () => {
    if (isAssortmentsPending) {
      return <RecentArrivalsSkeleton />
    }

    if (isAssortmentsError) {
      return <ErrorEmptyState onRetry={() => refetchAssortments()} />
    }

    if (recentAssortmentEntries.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0451")}
        </p>
      )
    }

    return (
      <ul className="space-y-3">
        {recentAssortmentEntries.map((item) => (
          <li
            className="flex items-start justify-between gap-4 rounded-lg border bg-card/50 p-3"
            key={item.id}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.itemName}</p>
              <p className="text-muted-foreground text-xs">{item.rackLabel}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
              <span className="font-mono text-muted-foreground">
                {formatDate(new Date(item.createdAt), "dd.MM.yyyy")}
              </span>
              <Badge variant={item.dangerous ? "warning" : "secondary"}>
                {item.dangerous
                  ? translateMessage("generated.m0976")
                  : translateMessage("generated.m0974")}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <InsightCard
      description={translateMessage("generated.m0452")}
      icon={PackageReceiveIcon}
      title={translateMessage("generated.m0453")}
    >
      {renderContent()}
    </InsightCard>
  )
}
