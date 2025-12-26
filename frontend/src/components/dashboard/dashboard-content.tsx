"use client"

import { Search } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState, Rack } from "./types"
import { filterWarehouses } from "./utils/filters"

const MOCK_RACKS: Rack[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `rack-${i}`,
  name: `Regał ${String.fromCharCode(65 + i)}`,
  rows: 4,
  cols: 6,
  minTemp: 10,
  maxTemp: 25,
  maxWeight: 1000,
  currentWeight: Math.floor(Math.random() * 800),
  occupancy: Math.floor(Math.random() * 100),
  items:
    i === 0
      ? [
          {
            id: "Item1",
            name: "Przykład",
            expiryDate: "2025-12-31",
            weight: 10,
            isDangerous: false,
          },
        ]
      : [],
}))

const MOCK_WAREHOUSES = [
  {
    id: "A1",
    name: "Magazyn A1",
    racks: MOCK_RACKS.slice(0, 5),
  },
  {
    id: "A2",
    name: "Magazyn A2",
    racks: MOCK_RACKS.slice(0, 1),
  },
  {
    id: "A3",
    name: "Magazyn A3",
    racks: MOCK_RACKS.slice(0, 3),
  },
]

export const DashboardContent = dynamic(
  () =>
    Promise.resolve(() => {
      const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
      const filteredWarehouses = filterWarehouses(MOCK_WAREHOUSES, filters)

      return (
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="my-4 flex items-center space-x-2">
            <div className="relative max-w-sm flex-1">
              <HugeiconsIcon
                className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
                icon={Search}
              />
              <Input
                className="pl-8"
                onChange={(e) =>
                  setFilters({ ...filters, query: e.target.value })
                }
                placeholder="Szukaj magazynu, regału lub ID..."
                value={filters.query}
              />
            </div>
            <WarehouseFilters filters={filters} onFilterChange={setFilters} />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-xl">Twoje Magazyny</h3>
            <WarehouseGrid warehouses={filteredWarehouses} />
          </div>
        </div>
      )
    }),
  {
    ssr: false,
  }
)
