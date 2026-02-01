import {
  Analytics01Icon,
  Clock01Icon,
  GroupItemsIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import {
  MOCK_ITEM_STATS,
  MOCK_ITEMS,
  MOCK_WAREHOUSES,
} from "@/components/dashboard/mock-data"
import type { Rack, Warehouse } from "@/components/dashboard/types"
import { formatDate, pluralize } from "@/components/dashboard/utils/helpers"
import ProtectedPage from "@/components/security/protected-page"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

  const stats = [
    {
      id: "warehouses",
      label: "Magazyny aktywne",
      value: formatNumber(totalWarehouses),
      hint: `${formatNumber(totalRacks)} ${pluralize(
        totalRacks,
        "regał",
        "regały",
        "regałów"
      )}`,
      icon: Package,
    },
    {
      id: "capacity",
      label: "Łączna pojemność",
      value: formatNumber(totalCapacity),
      hint: `${formatNumber(totalUsed)} zajęte`,
      icon: Analytics01Icon,
    },
    {
      id: "occupancy",
      label: "Zajętość",
      value: `${occupancyPercentage}%`,
      hint: `${formatNumber(availableSlots)} wolnych`,
      icon: Clock01Icon,
    },
    {
      id: "items",
      label: "Produkty w obiegu",
      value: formatNumber(MOCK_ITEMS.length),
      hint: `${formatNumber(dangerousItemsCount)} oznaczonych jako niebezpieczne`,
      icon: GroupItemsIcon,
    },
  ] as const

  const quickActions = [
    {
      id: "warehouses",
      title: "Przegląd magazynów",
      description: "Zarządzaj lokalizacjami i regałami",
      href: "/dashboard/warehouse",
      icon: Package,
    },
    {
      id: "items",
      title: "Asortyment",
      description: "Katalog produktów i stany magazynowe",
      href: "/dashboard/items",
      icon: GroupItemsIcon,
    },
  ] as const

  return (
    <ProtectedPage>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">Panel główny</h1>
          <p className="text-muted-foreground">
            Bieżący stan magazynów, alerty operacyjne i szybkie przejścia do
            kluczowych modułów.
          </p>
        </div>

        <section aria-labelledby="dashboard-stats">
          <h2 className="sr-only" id="dashboard-stats">
            Statystyki magazynowe
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon className="size-5" icon={stat.icon} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

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
            {quickActions.map((action) => (
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-auto w-full items-start justify-start gap-3 p-4 text-left",
                })}
                href={action.href}
                key={action.id}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon className="size-5" icon={action.icon} />
                </span>
                <span className="space-y-1">
                  <span className="block font-semibold">{action.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {action.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

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
            <Card id="dashboard-alerts">
              <CardHeader>
                <CardTitle>Alerty operacyjne</CardTitle>
                <CardDescription>
                  Zestawienie ryzyk wymagających uwagi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
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
                  <div className="flex items-center justify-between gap-4">
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
                  <div className="flex items-center justify-between gap-4">
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
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Najbliższe terminy
                    </p>
                    <ul className="space-y-2 text-sm">
                      {expiringSoonItemsList.map((item) => (
                        <li
                          className="flex items-center justify-between gap-3"
                          key={item.definitionId}
                        >
                          <span>{item.definition.name}</span>
                          <span className="text-muted-foreground text-xs">
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
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ostatnie przyjęcia</CardTitle>
                <CardDescription>
                  Najświeższe dostawy z ostatnich dni.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentItems.length > 0 ? (
                  <ul className="space-y-3">
                    {recentItems.map((item) => (
                      <li
                        className="flex items-start justify-between gap-4"
                        key={item.id}
                      >
                        <div>
                          <p className="font-medium">{item.definition.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.warehouseName} • {item.rackName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs">
                          <span className="text-muted-foreground">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Obłożenie magazynów</CardTitle>
                <CardDescription>
                  Najbardziej wypełnione lokalizacje.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topWarehouses.map((warehouse) => (
                  <div className="space-y-2" key={warehouse.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{warehouse.name}</span>
                      <Badge
                        variant={getOccupancyBadgeVariant(warehouse.occupancy)}
                      >
                        {warehouse.occupancy}%
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${getOccupancyBarClassName(
                          warehouse.occupancy
                        )}`}
                        style={{ width: `${warehouse.occupancy}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {formatNumber(warehouse.used)} /{" "}
                      {formatNumber(warehouse.capacity)} miejsc
                    </p>
                  </div>
                ))}
                <Link
                  className={buttonVariants({
                    size: "sm",
                    variant: "outline",
                    className: "w-full",
                  })}
                  href="/dashboard/warehouse"
                >
                  Zobacz wszystkie magazyny
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ProtectedPage>
  )
}
