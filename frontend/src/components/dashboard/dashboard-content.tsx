"use client"

import { Search } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState, Rack } from "./types"
import { filterWarehouses } from "./utils/filters"

const MOCK_RACKS: Rack[] = [
  {
    id: "rack-0",
    name: "Regał A",
    rows: 10,
    cols: 12,
    minTemp: 15,
    maxTemp: 25,
    maxWeight: 1000,
    currentWeight: 450,
    occupancy: 70,
    items: [
      {
        id: "item-0",
        name: "Produkt 1",
        qrCode: "QR-1",
        expiryDate: new Date("2025-12-31"),
        weight: 2.5,
        dimensions: { x: 350, y: 235, z: 18 },
        minTemp: 10,
        maxTemp: 30,
        comment: "Komentarz1",
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-1",
        name: "Produkt 2",
        qrCode: "QR-2",
        expiryDate: new Date("2026-06-30"),
        weight: 5.0,
        dimensions: { x: 150, y: 150, z: 300 },
        minTemp: 15,
        maxTemp: 25,
        comment: "Komentarz2",
        isDangerous: true,
        imageUrl: null,
      },
      {
        id: "item-2",
        name: "Produkt 3",
        qrCode: "QR-3",
        expiryDate: new Date("2030-12-31"),
        weight: 4.5,
        dimensions: { x: 610, y: 450, z: 180 },
        minTemp: 5,
        maxTemp: 35,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      null,
      {
        id: "item-4",
        name: "Produkt 5",
        qrCode: "QR-5",
        expiryDate: new Date("2025-06-30"),
        weight: 30.0,
        dimensions: { x: 400, y: 600, z: 120 },
        minTemp: 5,
        maxTemp: 30,
        comment: "Komentarz5",
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-5",
        name: "Produkt 6",
        qrCode: "QR-6",
        expiryDate: new Date("2025-12-31"),
        weight: 18,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 15,
        maxTemp: 25,
        comment: "",
        isDangerous: true,
        imageUrl: null,
      },
      null,
      null,
      null,
      {
        id: "item-9",
        name: "Produkt 10",
        qrCode: "QR-10",
        expiryDate: new Date("2025-12-31"),
        weight: 12,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 15,
        maxTemp: 25,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      {
        id: "item-12",
        name: "Produkt 13",
        qrCode: "QR-13",
        expiryDate: new Date("2025-12-31"),
        weight: 27,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 15,
        maxTemp: 25,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      {
        id: "item-13",
        name: "Produkt 14",
        qrCode: "QR-14",
        expiryDate: new Date("2025-12-31"),
        weight: 45,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 15,
        maxTemp: 25,
        comment: "",
        isDangerous: true,
        imageUrl: null,
      },
      null,
      {
        id: "item-15",
        name: "Produkt 16",
        qrCode: "QR-16",
        expiryDate: new Date("2025-12-31"),
        weight: 24,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 15,
        maxTemp: 25,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
    ],
  },
  {
    id: "rack-1",
    name: "Regał B",
    rows: 100,
    cols: 100,
    minTemp: 10,
    maxTemp: 20,
    maxWeight: 1000,
    currentWeight: 620,
    occupancy: 40,
    items: [
      {
        id: "item-b0",
        name: "Produkt B1",
        qrCode: "QR-B01",
        expiryDate: new Date("2025-12-31"),
        weight: 20,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 10,
        maxTemp: 20,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      {
        id: "item-b6",
        name: "Produkt B7",
        qrCode: "QR-B07",
        expiryDate: new Date("2025-12-31"),
        weight: 33,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 10,
        maxTemp: 20,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  {
    id: "rack-2",
    name: "Regał C",
    rows: 4,
    cols: 5,
    minTemp: 5,
    maxTemp: 15,
    maxWeight: 1000,
    currentWeight: 280,
    occupancy: 20,
    items: [
      {
        id: "item-c0",
        name: "Produkt C1",
        qrCode: "QR-C01",
        expiryDate: new Date("2025-12-31"),
        weight: 40,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 5,
        maxTemp: 15,
        comment: "",
        isDangerous: false,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      {
        id: "item-c10",
        name: "Produkt C11",
        qrCode: "QR-C11",
        expiryDate: new Date("2025-12-31"),
        weight: 22,
        dimensions: { x: 100, y: 100, z: 100 },
        minTemp: 5,
        maxTemp: 15,
        comment: "",
        isDangerous: true,
        imageUrl: null,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
]

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
    racks: MOCK_RACKS.slice(0, 8),
  },
]

export const DashboardContent = () => {
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
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
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
}
