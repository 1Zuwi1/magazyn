import type { FilterState, Warehouse } from "../types"

export function filterWarehouses(
  warehouses: Warehouse[],
  filters: FilterState
) {
  const result = warehouses.filter((warehouse) => {
    const matchesQuery =
      filters.query === "" ||
      warehouse.name.toLowerCase().includes(filters.query.toLowerCase()) ||
      warehouse.racks.some((rack) =>
        rack.items.some((item) =>
          item.id.toLowerCase().includes(filters.query.toLowerCase())
        )
      )
    if (!matchesQuery) {
      return false
    }

    const masMatchingRacks = warehouse.racks.some((rack) => {
      const tempMatch =
        rack.minTemp >= filters.tempRange[0] &&
        rack.maxTemp <= filters.tempRange[1]

      const occupancyMatch = rack.occupancy >= filters.minOccupancy

      return tempMatch && occupancyMatch
    })

    if (filters.tempRange && !masMatchingRacks) {
      return false
    }
    return masMatchingRacks
  })
  return result
}
