"use client"

import { useMemo, useState } from "react"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import type { Warehouse } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  WarehouseDialog,
  type WarehouseFormData,
} from "./components/warehouse-dialog"
import { WarehouseGrid } from "./components/warehouse-grid"

export default function WarehousesMain() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(
    MOCK_WAREHOUSES as Warehouse[]
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    Warehouse | undefined
  >(undefined)

  const stats = useMemo(() => {
    const totalRacks = warehouses.reduce((sum, w) => sum + w.racks.length, 0)
    return {
      total: warehouses.length,
      totalRacks,
    }
  }, [warehouses])

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setDialogOpen(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setDialogOpen(true)
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

  return (
    <section className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">Zarządzaj magazynami</h1>
          <p className="text-muted-foreground text-sm">
            {stats.total} magazynów · {stats.totalRacks} regałów łącznie
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWarehouse(undefined)
          }
          setDialogOpen(open)
        }}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />
    </section>
  )
}
