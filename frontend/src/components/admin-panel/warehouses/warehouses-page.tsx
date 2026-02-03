"use client"

import { Add01Icon, Package, Warehouse } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import type { Warehouse as WarehouseType } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import { WarehouseCard } from "./components/warehouse-card"
import {
  WarehouseDialog,
  type WarehouseFormData,
} from "./components/warehouse-dialog"

export default function WarehousesMain() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>(
    MOCK_WAREHOUSES as WarehouseType[]
  )
  const [open, setOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    WarehouseType | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<
    WarehouseType | undefined
  >(undefined)

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setOpen(true)
  }

  const handleEditWarehouse = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse)
    setOpen(true)
  }

  const handleDeleteWarehouse = (warehouse: WarehouseType) => {
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
      const newWarehouse: WarehouseType = {
        id: data.id,
        name: data.name,
        capacity: 0,
        used: 0,
        racks: [],
      }
      setWarehouses((prev) => [...prev, newWarehouse])
    }
  }

  // Calculate stats
  const totalCapacity = warehouses.reduce((acc, w) => acc + w.capacity, 0)
  const totalUsed = warehouses.reduce((acc, w) => acc + w.used, 0)
  const totalRacks = warehouses.reduce((acc, w) => acc + w.racks.length, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <Button onClick={handleAddWarehouse}>
            <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
            Dodaj magazyn
          </Button>
        }
        description="Zarządzaj magazynami i ich regałami"
        icon={Warehouse}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Magazyny"
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {warehouses.length}
            </span>
            <span className="text-muted-foreground text-xs">magazynów</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold">{totalRacks}</span>
            <span className="text-muted-foreground text-xs">regałów</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs">Zajętość:</span>
            <span className="font-mono font-semibold">
              {totalCapacity > 0
                ? Math.round((totalUsed / totalCapacity) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </AdminPageHeader>

      {/* Warehouse Grid */}
      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              className="size-7 text-muted-foreground"
              icon={Warehouse}
            />
          </div>
          <p className="mt-4 font-medium text-foreground">Brak magazynów</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Dodaj pierwszy magazyn, aby rozpocząć
          </p>
          <Button className="mt-4" onClick={handleAddWarehouse}>
            <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
            Dodaj magazyn
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              onDelete={handleDeleteWarehouse}
              onEdit={handleEditWarehouse}
              warehouse={warehouse}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
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
    </div>
  )
}
