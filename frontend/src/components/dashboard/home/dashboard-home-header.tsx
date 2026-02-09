"use client"

import {
  ChartLineData01Icon,
  Home01Icon,
  Package,
} from "@hugeicons/core-free-icons"
import { PageHeader } from "@/components/dashboard/page-header"
import useWarehouses from "@/hooks/use-warehouses"
import {
  formatNumber,
  getOccupancyStatVariant,
  TOP_WAREHOUSES_LIMIT,
} from "./dashboard-home.constants"

export function DashboardHomeHeader() {
  const { data: warehousesData } = useWarehouses({
    page: 0,
    size: TOP_WAREHOUSES_LIMIT,
  })

  const totalCapacity = warehousesData?.summary?.totalCapacity ?? 0
  const totalOccupied = warehousesData?.summary?.occupiedSlots ?? 0
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
  const totalWarehouses = warehousesData?.summary?.totalWarehouses ?? 0
  return (
    <PageHeader
      description="Bieżący stan magazynów, alerty operacyjne i szybkie przejścia do kluczowych modułów."
      icon={Home01Icon}
      stats={[
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
      ]}
      title="Panel główny"
    />
  )
}
