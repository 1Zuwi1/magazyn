"use client"

import { Search } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState, Rack, Warehouse } from "./types"

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

const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: "A1",
    name: "Magazyn A1",
    capacity: 1000,
    used: 750,
    racks: MOCK_RACKS.slice(0, 5),
  },
  // {
  //   id: "A2",
  //   name: "Magazyn A2",
  //   capacity: 500,
  //   used: 120,
  //   racks: MOCK_RACKS.slice(0, 1),
  // },
  // {
  //   id: "A3",
  //   name: "Magazyn A3",
  //   capacity: 300,
  //   used: 280,
  //   racks: MOCK_RACKS.slice(0, 3),
  // },
]

export function DashboardContent() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null
  )

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWarehouses = MOCK_WAREHOUSES.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.racks.some((r) =>
        r.items.some((i) =>
          i.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="my-4 flex items-center space-x-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj magazynu, regału lub ID..."
            value={searchQuery}
          />
        </div>
        <WarehouseFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {selectedWarehouse ? (
        <div>
          <Button onClick={() => setSelectedWarehouse(null)} variant="outline">
            Powrót
          </Button>
          <h1>Regał</h1>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl">Twoje Magazyny</h3>
          <WarehouseGrid
            onSelect={setSelectedWarehouse}
            warehouses={filteredWarehouses}
          />
        </div>
      )}
    </div>
  )
}
