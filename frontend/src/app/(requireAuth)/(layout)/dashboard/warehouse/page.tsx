import {
  Building05Icon,
  ChartLineData01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { PageHeader } from "@/components/dashboard/page-header"
import { WarehouseContent } from "@/components/dashboard/warehouse-content"
import ProtectedPage from "@/components/security/protected-page"
import { translateMessage } from "@/i18n/translate-message"
import { apiFetch } from "@/lib/fetcher"
import { WarehousesSchema } from "@/lib/schemas"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

function getOccupancyVariant(
  occupancy: number
): "default" | "warning" | "destructive" {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "default"
}

export default function WarehousePage() {
  return (
    <ProtectedPage>
      {async () => {
        const warehouses = await apiFetch("/api/warehouses", WarehousesSchema)

        const { totalWarehouses, totalCapacity, totalUsed } = {
          totalWarehouses: warehouses.totalElements,
          totalCapacity: warehouses.summary.totalCapacity,
          totalUsed: warehouses.summary.occupiedSlots,
        }
        const overallOccupancy =
          totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0

        const headerStats = [
          {
            label: translateMessage("generated.m0886"),
            value: totalWarehouses,
            icon: PackageIcon,
          },
          {
            label: translateMessage("generated.m0094"),
            value: `${overallOccupancy}%`,
            icon: ChartLineData01Icon,
            variant: getOccupancyVariant(overallOccupancy),
          },
        ]
        return (
          <div className="space-y-8">
            <PageHeader
              description={translateMessage("generated.m0101")}
              icon={Building05Icon}
              iconBadge={totalWarehouses}
              stats={headerStats}
              statsChildren={
                <div className="flex flex-col items-center rounded-lg border bg-background/50 px-4 py-2 backdrop-blur-sm">
                  <span className="font-bold font-mono text-foreground text-lg">
                    {totalUsed.toLocaleString("pl-PL")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    / {totalCapacity.toLocaleString("pl-PL")}
                  </span>
                </div>
              }
              title={translateMessage("generated.m0886")}
            />

            <WarehouseContent />
          </div>
        )
      }}
    </ProtectedPage>
  )
}
