"use client"

import {
  ChartLineData01Icon,
  Home01Icon,
  Package,
} from "@hugeicons/core-free-icons"
import { useLocale } from "next-intl"
import { PageHeader } from "@/components/dashboard/page-header"
import useWarehouses from "@/hooks/use-warehouses"
import { useAppTranslations } from "@/i18n/use-translations"
import {
  formatNumber,
  getOccupancyStatVariant,
  TOP_WAREHOUSES_LIMIT,
} from "./dashboard-home.constants"
export function DashboardHomeHeader() {
  const t = useAppTranslations()

  const locale = useLocale()
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
      description={t(
        "generated.dashboard.home.currentWarehouseStatusOperationalAlerts"
      )}
      icon={Home01Icon}
      stats={[
        {
          label: t("generated.shared.warehouses"),
          value: formatNumber(totalWarehouses, locale),
          icon: Package,
        },
        {
          label: t("generated.dashboard.home.occupied"),
          value: `${occupancyPercentage}%`,
          icon: ChartLineData01Icon,
          variant: getOccupancyStatVariant(occupancyPercentage),
        },
      ]}
      title={t("generated.shared.mainPanel")}
    />
  )
}
