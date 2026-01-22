"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
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
  const [open, setOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    Warehouse | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<
    Warehouse | undefined
  >(undefined)

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setOpen(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setOpen(true)
  }

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteWarehouse = () => {
    if (warehouseToDelete) {
      setWarehouses((prev) => prev.filter((w) => w.id !== warehouseToDelete.id))
      setWarehouseToDelete(undefined)
    }
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
        formId="warehouse-form"
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        open={open}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć magazyn "${warehouseToDelete?.name}"? Wszystkie regały w tym magazynie zostaną również usunięte.`}
        onConfirm={confirmDeleteWarehouse}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń magazyn"
      />
    </section>
  )
}
