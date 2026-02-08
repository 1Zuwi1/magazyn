import { Package } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import useWarehouses from "@/hooks/use-warehouses"
import { cn } from "@/lib/utils"
import { InsightCard } from "../stat-card"
import { formatNumber } from "./dashboard-home.constants"

type OccupancyBadgeVariant = "secondary" | "warning" | "destructive"
const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

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

export default function DashboardTopOccupiedWarehousesCard() {
  const { data: topWarehouses } = useWarehouses({
    size: 3,
    page: 0,
    sortBy: "occupancy",
    sortDir: "desc",
  })
  return (
    <InsightCard
      description="Najbardziej wypełnione lokalizacje."
      icon={Package}
      title="Obłożenie magazynów"
    >
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
              {formatNumber(warehouse.occupiedSlots)} /{" "}
              {formatNumber(warehouse.occupiedSlots + warehouse.freeSlots)}{" "}
              miejsc
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
  )
}
