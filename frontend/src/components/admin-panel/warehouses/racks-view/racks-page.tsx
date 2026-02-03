"use client"

import {
  Add01Icon,
  ArrowLeft02Icon,
  GridIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { mapRackCsv } from "@/components/admin-panel/warehouses/csv/utils/map-csv"
import type {
  Rack,
  Warehouse as WarehouseType,
} from "@/components/dashboard/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../../lib/constants"
import type { CsvRowType, RackFormData } from "../csv/utils/types"
import { RackDialog } from "./rack-dialog"
import { RackGrid } from "./racks-grid"

interface AdminRacksPageProps {
  warehouse: WarehouseType
}

export default function AdminRacksPage({ warehouse }: AdminRacksPageProps) {
  const [racks, setRacks] = useState<Rack[]>(warehouse.racks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRack, setSelectedRack] = useState<Rack | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rackToDelete, setRackToDelete] = useState<Rack | undefined>(undefined)

  const handleAddRack = () => {
    setSelectedRack(undefined)
    setDialogOpen(true)
  }

  const handleEditRack = (rack: Rack) => {
    setSelectedRack(rack)
    setDialogOpen(true)
  }

  const handleDeleteRack = (rack: Rack) => {
    setRackToDelete(rack)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRack = () => {
    if (rackToDelete) {
      setRacks((prev) => prev.filter((r) => r.id !== rackToDelete.id))
      setRackToDelete(undefined)
    }
  }

  const handleSubmit = (data: RackFormData) => {
    if (selectedRack === undefined) {
      const newRack: Rack = {
        ...data,
        id: crypto.randomUUID(),
        currentWeight: 0,
        occupancy: 0,
        items: [],
      }
      return setRacks((prev) => [...prev, newRack])
    }
    setRacks((prev) =>
      prev.map((rack) =>
        rack.id === selectedRack.id ? { ...rack, ...data } : rack
      )
    )
  }

  const handleCsvImport = (data: CsvRowType<"rack">[]) => {
    const newRacks = mapRackCsv(data)
    setRacks((prev) => [...prev, ...newRacks])
  }

  // Calculate stats
  const totalWeight = racks.reduce((acc, r) => acc + r.currentWeight, 0)
  const totalItems = racks.reduce((acc, r) => acc + r.items.length, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CsvImporter onImport={handleCsvImport} type="rack" />
            <Button onClick={handleAddRack}>
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              Dodaj regał
            </Button>
          </div>
        }
        description={`Zarządzaj regałami w magazynie ${warehouse.name}`}
        icon={GridIcon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Regały"
      >
        {/* Quick Stats & Back Link */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
            href="/admin/warehouses"
          >
            <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
            Wróć do magazynów
          </Link>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={GridIcon}
            />
            <span className="font-mono font-semibold text-primary">
              {racks.length}
            </span>
            <span className="text-muted-foreground text-xs">regałów</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold">{totalItems}</span>
            <span className="text-muted-foreground text-xs">przedmiotów</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs">Łączna waga:</span>
            <span className="font-mono font-semibold">{totalWeight} kg</span>
          </div>
        </div>
      </AdminPageHeader>

      {/* Rack Grid */}
      <RackGrid
        onDelete={handleDeleteRack}
        onEdit={handleEditRack}
        racks={racks}
      />

      {/* Dialogs */}
      <RackDialog
        currentRow={selectedRack}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć regał "${rackToDelete?.name}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteRack}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń regał"
      />
    </div>
  )
}
