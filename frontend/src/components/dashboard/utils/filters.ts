import type { Warehouse } from "@/lib/schemas"
import type { FilterState } from "../types"

export function filterWarehouses(
  warehouses: Warehouse[],
  filters: FilterState
) {
  if (!warehouses) {
    return []
  }
  return warehouses.filter((warehouse) => {
    // Search by warehouse name, rack name, or item ID
    const matchesQuery =
      filters.query === "" ||
      warehouse.name.toLowerCase().includes(filters.query.toLowerCase())
    // ||
    // warehouse.racks.some(
    //   (rack) =>
    //     rack.name.toLowerCase().includes(filters.query.toLowerCase()) ||
    //     rack.items.some(
    //       (item) =>
    //         item?.id.toLowerCase().includes(filters.query.toLowerCase()) ||
    //         item?.name.toLowerCase().includes(filters.query.toLowerCase())
    //     )
    // )
    return matchesQuery

    // const occupancyPercentage =
    //   warehouse.capacity > 0 ? (warehouse.used / warehouse.capacity) * 100 : 0
    // if (occupancyPercentage < filters.minOccupancy) {
    //   return false
    // }

    // const hasMatchingRacks = warehouse.racks.some((rack) => {
    //   const isWithinTempRange =
    //     rack.minTemp >= filters.tempRange[0] &&
    //     rack.maxTemp <= filters.tempRange[1]

    //   return isWithinTempRange
    // })

    // return hasMatchingRacks
  })
}
