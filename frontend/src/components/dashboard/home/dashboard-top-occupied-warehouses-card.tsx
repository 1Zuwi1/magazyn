import { Package } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useWarehouses from "@/hooks/use-warehouses"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { InsightCard } from "../stat-card"
import { formatNumber } from "./dashboard-home.constants"

type OccupancyBadgeVariant = "secondary" | "warning" | "destructive"
const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90
const TOP_WAREHOUSES_COUNT = 3

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

function TopOccupiedWarehousesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: TOP_WAREHOUSES_COUNT }, (_, i) => (
        <div className="space-y-2" key={`warehouse-skeleton-${i.toString()}`}>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
      <Skeleton className="mt-2 h-9 w-full rounded-md" />
    </div>
  )
}

export default function DashboardTopOccupiedWarehousesCard() {
  const t = useAppTranslations()

  const locale = useLocale()
  const {
    data: topWarehouses,
    isPending,
    isError,
    refetch,
  } = useWarehouses({
    size: TOP_WAREHOUSES_COUNT,
    page: 0,
    sortBy: "occupancy",
    sortDir: "desc",
  })

  const renderContent = () => {
    if (isPending) {
      return <TopOccupiedWarehousesSkeleton />
    }

    if (isError) {
      return <ErrorEmptyState onRetry={() => refetch()} />
    }

    return (
      <div className="space-y-4">
        {topWarehouses?.content.map((warehouse) => (
          <div className="space-y-2" key={warehouse.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{warehouse.name}</span>
              <Badge variant={getOccupancyBadgeVariant(warehouse.occupancy)}>
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
              {t("generated.dashboard.home.slots", {
                value0: formatNumber(warehouse.occupiedSlots, locale),
                value1: formatNumber(
                  warehouse.occupiedSlots + warehouse.freeSlots,
                  locale
                ),
              })}
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
          {t("generated.dashboard.home.viewAllWarehouses")}
        </Link>
      </div>
    )
  }

  return (
    <InsightCard
      description={t("generated.dashboard.home.mostFilledLocations")}
      icon={Package}
      title={t("generated.dashboard.home.warehouseOccupancy")}
    >
      {renderContent()}
    </InsightCard>
  )
}
