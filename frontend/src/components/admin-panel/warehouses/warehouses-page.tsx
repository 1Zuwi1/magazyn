"use client"

import { useMemo, useState } from "react"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import type { Rack, Warehouse } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  WarehouseDialog,
  type WarehouseFormData,
} from "./components/warehouse-dialog"
import { WarehouseGrid } from "./components/warehouse-grid"
import { CsvImporter } from "./csv/csv-importer"
import type { CsvRackRow, CsvRow } from "./csv/utils/csv-utils"

export default function WarehousesMain() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(
    MOCK_WAREHOUSES as Warehouse[]
  )
  const [open, setOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    Warehouse | undefined
  >(undefined)

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ id: w.id, name: w.name })),
    [warehouses]
  )

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setOpen(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setOpen(true)
  }

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id))
  }

  const handleSubmit = (data: WarehouseFormData) => {
    if (selectedWarehouse) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === data.id ? { ...w, name: data.name } : w))
      )
    } else {
      const newWarehouse: Warehouse = {
        id: data.id,
        name: data.name,
        capacity: 0,
        used: 0,
        racks: [],
      }
      setWarehouses((prev) => [...prev, newWarehouse])
    }
  }

  const handleCsvImport = (data: CsvRow[], warehouseId?: string) => {
    if (!warehouseId) {
      return
    }

    const rackRows = data as CsvRackRow[]
    const newRacks: Rack[] = rackRows.map((row) => ({
      symbol: row.symbol,
      name: row.name,
      rows: row.rows,
      cols: row.cols,
      minTemp: row.minTemp,
      maxTemp: row.maxTemp,
      maxWeight: row.maxWeight,
      currentWeight: 0,
      comment: row.comment,
      occupancy: 0,
      items: [],
    }))

    setWarehouses((prev) =>
      prev.map((w) =>
        w.id === warehouseId ? { ...w, racks: [...w.racks, ...newRacks] } : w
      )
    )
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">Zarządzaj magazynami</h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <CsvImporter
            onImport={handleCsvImport}
            type="rack"
            warehouses={warehouseOptions}
          />
          <Button onClick={handleAddWarehouse}>Dodaj magazyn</Button>
        </div>
      </header>

      <Separator />

      <WarehouseGrid
        onDelete={handleDeleteWarehouse}
        onEdit={handleEditWarehouse}
        warehouses={warehouses}
      />

      <WarehouseDialog
        currentRow={
          selectedWarehouse
            ? { id: selectedWarehouse.id, name: selectedWarehouse.name }
            : undefined
        }
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        open={open}
      />
    </section>
  )
}
