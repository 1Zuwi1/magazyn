"use client"

import { Add01Icon, Package, WarehouseIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { Button } from "@/components/ui/button"
import useWarehouses, { type WarehousesList } from "@/hooks/use-warehouses"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import { WarehouseCard } from "./components/warehouse-card"
import {
  WarehouseDialog,
  type WarehouseFormData,
} from "./components/warehouse-dialog"

const WAREHOUSES_SUMMARY_PAGE_SIZE = 1000

type ApiWarehouse = WarehousesList["content"][number]

interface WarehouseCardModel {
  id: string
  name: string
  capacity: number
  used: number
  racks: unknown[]
}

const mapApiWarehouseToCardModel = (
  warehouse: ApiWarehouse
): WarehouseCardModel => {
  const racks: unknown[] = []
  racks.length = warehouse.racksCount

  return {
    id: String(warehouse.id),
    name: warehouse.name,
    capacity: warehouse.occupiedSlots + warehouse.freeSlots,
    used: warehouse.occupiedSlots,
    racks,
  }
}

export default function WarehousesMain() {
  const {
    data: warehousesData,
    isPending: isWarehousesPending,
    isError: isWarehousesError,
  } = useWarehouses({ page: 0, size: WAREHOUSES_SUMMARY_PAGE_SIZE })
  const apiWarehouses = warehousesData?.content ?? []
  const mappedWarehouses = useMemo(
    () => apiWarehouses.map(mapApiWarehouseToCardModel),
    [apiWarehouses]
  )
  const [warehouses, setWarehouses] =
    useState<WarehouseCardModel[]>(mappedWarehouses)
  const [open, setOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    WarehouseCardModel | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<
    WarehouseCardModel | undefined
  >(undefined)

  useEffect(() => {
    setWarehouses(mappedWarehouses)
  }, [mappedWarehouses])

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setOpen(true)
  }

  const handleEditWarehouse = (warehouse: WarehouseCardModel) => {
    setSelectedWarehouse(warehouse)
    setOpen(true)
  }

  const handleDeleteWarehouse = (warehouse: WarehouseCardModel) => {
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
      const newWarehouse: WarehouseCardModel = {
        id: data.id,
        name: data.name,
        capacity: 0,
        used: 0,
        racks: [],
      }
      setWarehouses((prev) => [...prev, newWarehouse])
    }
  }

  const totalWarehouses = warehousesData?.totalElements ?? warehouses.length
  const totalCapacity = apiWarehouses.reduce(
    (acc, warehouse) => acc + warehouse.occupiedSlots + warehouse.freeSlots,
    0
  )
  const totalUsed = apiWarehouses.reduce(
    (acc, warehouse) => acc + warehouse.occupiedSlots,
    0
  )
  const totalRacks = apiWarehouses.reduce(
    (acc, warehouse) => acc + warehouse.racksCount,
    0
  )
  let warehousesContent: ReactNode

  if (isWarehousesPending) {
    warehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16">
        <p className="font-medium text-foreground">Ładowanie magazynów...</p>
      </div>
    )
  } else if (isWarehousesError) {
    warehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16">
        <p className="font-medium text-foreground">
          Nie udało się pobrać magazynów.
        </p>
      </div>
    )
  } else if (warehouses.length === 0) {
    warehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-7 text-muted-foreground"
            icon={WarehouseIcon}
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
    )
  } else {
    warehousesContent = (
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
    )
  }

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
        icon={WarehouseIcon}
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
              {totalWarehouses}
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
      {warehousesContent}

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
