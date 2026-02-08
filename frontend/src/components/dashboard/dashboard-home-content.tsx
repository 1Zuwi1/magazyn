"use client"

import {
  AlertCircleIcon,
  Analytics01Icon,
  ChartLineData01Icon,
  Clock01Icon,
  GroupItemsIcon,
  Home01Icon,
  Package,
  PackageReceiveIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useMemo } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  InsightCard,
  QuickActionCard,
  StatCard,
} from "@/components/dashboard/stat-card"
import {
  formatDate,
  getDaysUntilExpiry,
  pluralize,
} from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import useAssortments from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import { useMultipleRacks } from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import { cn } from "@/lib/utils"

const NUMBER_FORMATTER = new Intl.NumberFormat("pl-PL")
const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90
const EXPIRY_WARNING_DAYS = 14
const EXPIRY_FALLBACK_DAYS = Number.POSITIVE_INFINITY
const RECENT_ITEMS_LIMIT = 4
const EXPIRING_ITEMS_LIMIT = 3
const TOP_WAREHOUSES_LIMIT = 3

type OccupancyBadgeVariant = "secondary" | "warning" | "destructive"
interface WarehouseSummary {
  id: number
  name: string
  capacity: number
  used: number
  occupancy: number
}

const formatNumber = (value: number): string => NUMBER_FORMATTER.format(value)

const getOccupancyBadgeVariant = (occupancy: number): OccupancyBadgeVariant => {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "secondary"
}

const getOccupancyBarClassName = (occupancy: number): string => {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "bg-destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "bg-orange-500"
  }
  return "bg-primary"
}

const getOccupancyStatVariant = (
  occupancy: number
): "default" | "warning" | "destructive" => {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "default"
}

export default function DashboardHomeContent() {
  const {
    data: warehousesData,
    isPending: isWarehousesPending,
    isError: isWarehousesError,
  } = useWarehouses({ page: 0, size: 1 })
  const {
    data: assortmentsData,
    isPending: isAssortmentsPending,
    isError: isAssortmentsError,
  } = useAssortments({
    page: 0,
    size: RECENT_ITEMS_LIMIT,
    sortBy: "createdAt",
    sortDir: "desc",
  })

  const isSummaryPending = isWarehousesPending || isAssortmentsPending
  const hasSummaryError = isWarehousesError || isAssortmentsError
  let summaryTitleBadge: string | undefined

  if (hasSummaryError) {
    summaryTitleBadge = "Błąd danych"
  } else if (isSummaryPending) {
    summaryTitleBadge = "Ładowanie"
  }

  const assortments = useMemo(
    () => assortmentsData?.content ?? [],
    [assortmentsData?.content]
  )
  const warehouseSummaries = useMemo<WarehouseSummary[]>(
    () =>
      (warehousesData?.content ?? []).map((warehouse) => {
        const capacity = warehouse.occupiedSlots + warehouse.freeSlots
        const used = warehouse.occupiedSlots
        return {
          id: warehouse.id,
          name: warehouse.name,
          capacity,
          used,
          occupancy: capacity > 0 ? Math.round((used / capacity) * 100) : 0,
        }
      }),
    [warehousesData?.content]
  )
  const allAssortmentItemIds = useMemo(
    () => [...new Set(assortments.map((item) => item.itemId))],
    [assortments]
  )
  const recentAssortmentRackIds = useMemo(
    () => [...new Set(assortments.map((item) => item.rackId))],
    [assortments]
  )

  const itemDefinitionQueries = useMultipleItems({
    itemIds: allAssortmentItemIds,
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
      rackLabelsMap.set(
        query.data.id,
        query.data.name?.trim() || query.data.marker.trim()
      )
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
          itemName: itemDefinition?.name ?? `Produkt #${assortment.itemId}`,
          rackLabel:
            rackLabelsById.get(assortment.rackId) ??
            `Regał #${assortment.rackId}`,
        }
      }),
    [itemDefinitionsById, rackLabelsById, assortments]
  )
  const dangerousItemsCount = useMemo(() => {
    let dangerousCount = 0
    for (const assortment of assortments ?? []) {
      if (itemDefinitionsById.get(assortment.itemId)?.dangerous) {
        dangerousCount += 1
      }
    }
    return dangerousCount
  }, [assortments, itemDefinitionsById])
  const expiringSoonItems = useMemo(
    () =>
      (assortments ?? []).flatMap((assortment) => {
        const expiresAt = new Date(assortment.expiresAt)
        if (Number.isNaN(expiresAt.getTime())) {
          return []
        }

        const daysUntilExpiry = getDaysUntilExpiry(new Date(), expiresAt)
        if (daysUntilExpiry > EXPIRY_WARNING_DAYS) {
          return []
        }

        const definition = itemDefinitionsById.get(assortment.itemId)
        return [
          {
            definitionId: assortment.id,
            definition: {
              name: definition?.name ?? `Produkt #${assortment.itemId}`,
            },
            daysUntilExpiry,
          },
        ]
      }),
    [assortments, itemDefinitionsById]
  )
  const expiringSoonItemsList = useMemo(
    () =>
      [...expiringSoonItems]
        .sort(
          (a, b) =>
            (a.daysUntilExpiry ?? EXPIRY_FALLBACK_DAYS) -
            (b.daysUntilExpiry ?? EXPIRY_FALLBACK_DAYS)
        )
        .slice(0, EXPIRING_ITEMS_LIMIT),
    [expiringSoonItems]
  )
  const criticalWarehouses = useMemo(
    () =>
      warehouseSummaries.filter(
        (warehouse) => warehouse.occupancy >= OCCUPANCY_CRITICAL_THRESHOLD
      ),
    [warehouseSummaries]
  )
  const topWarehouses = useMemo(
    () =>
      [...warehouseSummaries]
        .sort((a, b) => b.occupancy - a.occupancy)
        .slice(0, TOP_WAREHOUSES_LIMIT),
    [warehouseSummaries]
  )
  const totalCapacity = warehousesData?.summary?.totalCapacity ?? 0
  const totalOccupied = warehousesData?.summary?.occupiedSlots ?? 0
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
  const totalWarehouses = warehousesData?.summary?.totalWarehouses ?? 0
  const totalRacks = warehousesData?.summary?.totalRacks ?? 0
  const productsInCirculation = assortmentsData?.totalElements ?? 0

  const getOccupancyCardVariant = (): "danger" | "warning" | "success" => {
    if (occupancyPercentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
      return "danger"
    }
    if (occupancyPercentage >= OCCUPANCY_WARNING_THRESHOLD) {
      return "warning"
    }
    return "success"
  }

  const headerStats = [
    {
      label: "Magazyny",
      value: formatNumber(totalWarehouses),
      icon: Package,
    },
    {
      label: "Zajętość",
      value: `${occupancyPercentage}%`,
      icon: ChartLineData01Icon,
      variant: getOccupancyStatVariant(occupancyPercentage),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        description="Bieżący stan magazynów, alerty operacyjne i szybkie przejścia do kluczowych modułów."
        icon={Home01Icon}
        stats={headerStats}
        title="Panel główny"
        titleBadge={summaryTitleBadge}
      />

      {/* Stats Grid */}
      <section aria-labelledby="dashboard-stats">
        <h2 className="sr-only" id="dashboard-stats">
          Statystyki magazynowe
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            hint={`${formatNumber(totalRacks)} ${pluralize(totalRacks, "regał", "regały", "regałów")}`}
            icon={Package}
            label="Magazyny aktywne"
            value={formatNumber(totalWarehouses)}
            variant="primary"
          />
          <StatCard
            hint={`${formatNumber(warehousesData?.summary?.occupiedSlots ?? 0)} zajęte`}
            icon={Analytics01Icon}
            label="Łączna pojemność"
            value={formatNumber(warehousesData?.summary?.totalCapacity ?? 0)}
            variant="default"
          />
          <StatCard
            hint={`${formatNumber(warehousesData?.summary?.freeSlots ?? 0)} wolnych`}
            icon={Clock01Icon}
            label="Zajętość"
            value={`${occupancyPercentage}%`}
            variant={getOccupancyCardVariant()}
          />
          <StatCard
            hint={`${formatNumber(dangerousItemsCount)} oznaczonych jako niebezpieczne`}
            icon={GroupItemsIcon}
            label="Produkty w obiegu"
            value={formatNumber(productsInCirculation)}
            variant="default"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="dashboard-actions" className="space-y-4">
        <div>
          <h2 className="font-semibold text-xl" id="dashboard-actions">
            Szybkie akcje
          </h2>
          <p className="text-muted-foreground text-sm">
            Najczęstsze zadania w jednym miejscu.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/dashboard/warehouse">
            <QuickActionCard
              description="Zarządzaj lokalizacjami i regałami"
              href="/dashboard/warehouse"
              icon={Package}
              title="Przegląd magazynów"
            />
          </Link>
          <Link href="/dashboard/items">
            <QuickActionCard
              description="Katalog produktów i stany magazynowe"
              href="/dashboard/items"
              icon={GroupItemsIcon}
              title="Asortyment"
            />
          </Link>
        </div>
      </section>

      {/* Insights Grid */}
      <section aria-labelledby="dashboard-insights" className="space-y-4">
        <div>
          <h2 className="font-semibold text-xl" id="dashboard-insights">
            Wgląd operacyjny
          </h2>
          <p className="text-muted-foreground text-sm">
            Najważniejsze alerty, ostatnie przyjęcia i obłożenie magazynów.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
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
                      criticalWarehouses.length > 0 ? "destructive" : "success"
                    }
                  >
                    {formatNumber(criticalWarehouses.length)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
                  <span>
                    Produkty z terminem poniżej {EXPIRY_WARNING_DAYS} dni
                  </span>
                  <Badge
                    variant={
                      expiringSoonItems.length > 0 ? "warning" : "success"
                    }
                  >
                    {formatNumber(expiringSoonItems.length)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-2">
                  <span>Produkty niebezpieczne</span>
                  <Badge
                    variant={dangerousItemsCount > 0 ? "warning" : "success"}
                  >
                    {formatNumber(dangerousItemsCount)}
                  </Badge>
                </div>
              </div>
              {expiringSoonItemsList.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Najbliższe terminy
                  </p>
                  <ul className="space-y-2 text-sm">
                    {expiringSoonItemsList.map((item) => (
                      <li
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2"
                        key={item.definitionId}
                      >
                        <span className="truncate">{item.definition.name}</span>
                        <span className="shrink-0 font-mono text-muted-foreground text-xs">
                          {item.daysUntilExpiry ?? "—"} dni
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
              {criticalWarehouses.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Krytyczne lokalizacje
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {criticalWarehouses.map((warehouse) => (
                      <Badge key={warehouse.id} variant="destructive">
                        {warehouse.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InsightCard>

          <InsightCard
            description="Najświeższe dostawy z ostatnich dni."
            icon={PackageReceiveIcon}
            title="Ostatnie przyjęcia"
          >
            {recentAssortmentEntries.length > 0 ? (
              <ul className="space-y-3">
                {recentAssortmentEntries.map((item) => (
                  <li
                    className="flex items-start justify-between gap-4 rounded-lg border bg-card/50 p-3"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.itemName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.rackLabel}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                      <span>{item.id}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatDate(new Date(item.createdAt))}
                      </span>
                      <Badge variant={item.dangerous ? "warning" : "secondary"}>
                        {item.dangerous ? "Niebezpieczny" : "Standard"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                Brak ostatnich przyjęć do wyświetlenia.
              </p>
            )}
          </InsightCard>

          <InsightCard
            description="Najbardziej wypełnione lokalizacje."
            icon={Package}
            title="Obłożenie magazynów"
          >
            <div className="space-y-4">
              {topWarehouses.map((warehouse) => (
                <div className="space-y-2" key={warehouse.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {warehouse.name}
                    </span>
                    <Badge
                      variant={getOccupancyBadgeVariant(warehouse.occupancy)}
                    >
                      {warehouse.occupancy}%
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getOccupancyBarClassName(warehouse.occupancy)
                      )}
                      style={{ width: `${warehouse.occupancy}%` }}
                    />
                  </div>
                  <p className="font-mono text-muted-foreground text-xs">
                    {formatNumber(warehouse.used)} /{" "}
                    {formatNumber(warehouse.capacity)} miejsc
                  </p>
                </div>
              ))}
              <Link
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "mt-2 w-full",
                })}
                href="/dashboard/warehouse"
              >
                Zobacz wszystkie magazyny
              </Link>
            </div>
          </InsightCard>
        </div>
      </section>
    </div>
  )
}
