"use client"

import {
  Analytics01Icon,
  Clock01Icon,
  GroupItemsIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { useMemo } from "react"
import { StatCard } from "@/components/dashboard/stat-card"
import { pluralize } from "@/components/dashboard/utils/helpers"
import useAssortments from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import useWarehouses from "@/hooks/use-warehouses"
import {
  formatNumber,
  OCCUPANCY_CRITICAL_THRESHOLD,
  OCCUPANCY_WARNING_THRESHOLD,
  RECENT_ITEMS_LIMIT,
  TOP_WAREHOUSES_LIMIT,
} from "./dashboard-home.constants"

const getOccupancyCardVariant = (
  occupancyPercentage: number
): "danger" | "warning" | "success" => {
  if (occupancyPercentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "danger"
  }
  if (occupancyPercentage >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "success"
}

export function DashboardHomeStats() {
  const { data: warehousesData } = useWarehouses({
    page: 0,
    size: TOP_WAREHOUSES_LIMIT,
  })
  const { data: assortmentsData } = useAssortments({
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

  const totalCapacity = warehousesData?.summary?.totalCapacity ?? 0
  const totalOccupied = warehousesData?.summary?.occupiedSlots ?? 0
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const totalWarehouses = warehousesData?.summary?.totalWarehouses ?? 0
  const totalRacks = warehousesData?.summary?.totalRacks ?? 0
  const productsInCirculation = assortmentsData?.totalElements ?? 0

  return (
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
          variant={getOccupancyCardVariant(occupancyPercentage)}
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
  )
}
