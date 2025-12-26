import type { FilterState, Warehouse } from "../types"

export function filterWarehouses(
  warehouses: Omit<Warehouse, "used" | "capacity">[],
  filters: FilterState
) {
  return warehouses
    .map((warehouse) => {
      const capacity = warehouse.racks.reduce(
        (acc, rack) => acc + rack.rows * rack.cols,
        0
      )
      const used = warehouse.racks.reduce(
        (acc, rack) =>
          acc + Math.floor((rack.occupancy / 100) * rack.rows * rack.cols),
        0
      )
      return {
        ...warehouse,
        capacity,
        used,
      }
    })
    .filter((warehouse) => {
      // Search by warehouse name, rack name, or item ID
      const matchesQuery =
        filters.query === "" ||
        warehouse.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        warehouse.racks.some(
          (rack) =>
            rack.name.toLowerCase().includes(filters.query.toLowerCase()) ||
            rack.items.some((item) =>
              item.id.toLowerCase().includes(filters.query.toLowerCase())
            )
        )
      if (!matchesQuery) {
        return false
      }

      const occupancyPercentage =
        warehouse.capacity > 0 ? (warehouse.used / warehouse.capacity) * 100 : 0
      if (occupancyPercentage < filters.minOccupancy) {
        return false
      }

      const hasMatchingRacks = warehouse.racks.some((rack) => {
        // Skip empty racks if showEmpty is false
        if (!filters.showEmpty && rack.occupancy === 0) {
          return false
        }

        const tempMatch =
          rack.minTemp >= filters.tempRange[0] &&
          rack.maxTemp <= filters.tempRange[1]

        return tempMatch
      })

      return hasMatchingRacks
    })
}
