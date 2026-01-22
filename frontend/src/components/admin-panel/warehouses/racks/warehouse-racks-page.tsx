"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/confirm-dialog"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import type {
  CsvRackRow,
  CsvRow,
} from "@/components/admin-panel/warehouses/csv/utils/csv-utils"
import type { Rack, Warehouse } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RackDialog, type RackFormData } from "./rack-dialog"
import { RackGrid } from "./rack-grid"

interface WarehouseRacksPageProps {
  warehouse: Warehouse
}

export default function WarehouseRacksPage({
  warehouse,
}: WarehouseRacksPageProps) {
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
    if (selectedRack) {
      setRacks((prev) =>
        prev.map((r) =>
          r.id === data.id
            ? {
                ...r,
                symbol: data.symbol,
                name: data.name,
                rows: data.rows,
                cols: data.cols,
                minTemp: data.minTemp,
                maxTemp: data.maxTemp,
                maxWeight: data.maxWeight,
                comment: data.comment,
              }
            : r
        )
      )
    } else {
      const newRack: Rack = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        maxWeight: data.maxWeight,
        currentWeight: 0,
        comment: data.comment,
        occupancy: 0,
        items: [],
      }
      setRacks((prev) => [...prev, newRack])
    }
  }

  const handleCsvImport = (data: CsvRow[]) => {
    const rackRows = data as CsvRackRow[]
    const newRacks: Rack[] = rackRows.map((row) => ({
      id: row.id,
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
    setRacks((prev) => [...prev, ...newRacks])
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">
            Regały w magazynie: {warehouse.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {racks.length} regałów
          </p>
        </div>
        <div className="flex gap-2">
          <CsvImporter onImport={handleCsvImport} type="rack" />
          <Button onClick={handleAddRack}>Dodaj regał</Button>
        </div>
      </header>

      <Separator />

      <RackGrid
        onDelete={handleDeleteRack}
        onEdit={handleEditRack}
        racks={racks}
      />

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
    </section>
  )
}
