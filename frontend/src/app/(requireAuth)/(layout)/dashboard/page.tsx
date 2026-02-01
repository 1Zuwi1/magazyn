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
import {
  MOCK_ITEM_STATS,
  MOCK_ITEMS,
  MOCK_WAREHOUSES,
} from "@/components/dashboard/mock-data"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  InsightCard,
  QuickActionCard,
  StatCard,
} from "@/components/dashboard/stat-card"
import type { Rack, Warehouse } from "@/components/dashboard/types"
import { formatDate, pluralize } from "@/components/dashboard/utils/helpers"
import ProtectedPage from "@/components/security/protected-page"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NUMBER_FORMATTER = new Intl.NumberFormat("pl-PL")
const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90
const EXPIRY_WARNING_DAYS = 365
const EXPIRY_FALLBACK_DAYS = Number.POSITIVE_INFINITY
const RECENT_ITEMS_LIMIT = 4
const TOP_WAREHOUSES_LIMIT = 3
const EXPIRING_ITEMS_LIMIT = 3

type WarehouseBase = Omit<Warehouse, "capacity" | "used">

type OccupancyBadgeVariant = "secondary" | "warning" | "destructive"

interface WarehouseSummary {
  id: string
  name: string
  capacity: number
  used: number
  occupancy: number
  rackCount: number
}

const formatNumber = (value: number): string => NUMBER_FORMATTER.format(value)

const getRackCapacity = (rack: Rack): number => rack.rows * rack.cols

const getRackUsedSlots = (rack: Rack): number =>
  Math.floor((rack.occupancy / 100) * getRackCapacity(rack))

const buildWarehouseSummary = (warehouse: WarehouseBase): WarehouseSummary => {
  let capacity = 0
  let used = 0

  for (const rack of warehouse.racks) {
    capacity += getRackCapacity(rack)
    used += getRackUsedSlots(rack)
  }

  const occupancy = capacity > 0 ? Math.round((used / capacity) * 100) : 0

  return {
    id: warehouse.id,
    name: warehouse.name,
    capacity,
    used,
    occupancy,
    rackCount: warehouse.racks.length,
  }
}

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

export default function Page() {
  const warehouses: WarehouseBase[] = MOCK_WAREHOUSES
  const warehouseSummaries = warehouses.map(buildWarehouseSummary)

  let totalRacks = 0
  let totalCapacity = 0
  let totalUsed = 0

  for (const summary of warehouseSummaries) {
    totalRacks += summary.rackCount
    totalCapacity += summary.capacity
    totalUsed += summary.used
  }

  const totalWarehouses = warehouseSummaries.length
  const availableSlots = Math.max(totalCapacity - totalUsed, 0)
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0

  const dangerousItemsCount = MOCK_ITEMS.filter(
    (item) => item.definition.isDangerous
  ).length
  const expiringSoonItems = MOCK_ITEM_STATS.filter((item) => {
    const daysUntilExpiry = item.daysUntilExpiry ?? EXPIRY_FALLBACK_DAYS
    return daysUntilExpiry <= EXPIRY_WARNING_DAYS
  })
  const expiringSoonItemsList = [...expiringSoonItems]
    .sort((a, b) => {
      const daysUntilExpiry = a.daysUntilExpiry ?? EXPIRY_FALLBACK_DAYS
      const nextDaysUntilExpiry = b.daysUntilExpiry ?? EXPIRY_FALLBACK_DAYS
      return daysUntilExpiry - nextDaysUntilExpiry
    })
    .slice(0, EXPIRING_ITEMS_LIMIT)
  const criticalWarehouses = warehouseSummaries.filter(
    (summary) => summary.occupancy >= OCCUPANCY_CRITICAL_THRESHOLD
  )

  const recentItems = [...MOCK_ITEMS]
    .sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime())
    .slice(0, RECENT_ITEMS_LIMIT)

  const topWarehouses = [...warehouseSummaries]
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, TOP_WAREHOUSES_LIMIT)

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
      value: totalWarehouses,
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
    <ProtectedPage>
      <div className="space-y-8">
        <PageHeader
          description="Bieżący stan magazynów, alerty operacyjne i szybkie przejścia do kluczowych modułów."
          icon={Home01Icon}
          stats={headerStats}
          title="Panel główny"
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
              hint={`${formatNumber(totalUsed)} zajęte`}
              icon={Analytics01Icon}
              label="Łączna pojemność"
              value={formatNumber(totalCapacity)}
              variant="default"
            />
            <StatCard
              hint={`${formatNumber(availableSlots)} wolnych`}
              icon={Clock01Icon}
              label="Zajętość"
              value={`${occupancyPercentage}%`}
              variant={getOccupancyCardVariant()}
            />
            <StatCard
              hint={`${formatNumber(dangerousItemsCount)} oznaczonych jako niebezpieczne`}
              icon={GroupItemsIcon}
              label="Produkty w obiegu"
              value={formatNumber(MOCK_ITEMS.length)}
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
                    <span>
                      Magazyny powyżej {OCCUPANCY_CRITICAL_THRESHOLD}%
                    </span>
                    <Badge
                      variant={
                        criticalWarehouses.length > 0
                          ? "destructive"
                          : "success"
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
                          <span className="truncate">
                            {item.definition.name}
                          </span>
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
              {recentItems.length > 0 ? (
                <ul className="space-y-3">
                  {recentItems.map((item) => (
                    <li
                      className="flex items-start justify-between gap-4 rounded-lg border bg-card/50 p-3"
                      key={item.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.definition.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {item.warehouseName} • {item.rackName}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {formatDate(item.addedDate)}
                        </span>
                        <Badge
                          variant={
                            item.definition.isDangerous
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {item.definition.isDangerous
                            ? "Niebezpieczny"
                            : "Standard"}
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
    </ProtectedPage>
  )
}
