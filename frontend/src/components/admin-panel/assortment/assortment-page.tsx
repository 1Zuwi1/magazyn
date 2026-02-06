"use client"

import {
  Add01Icon,
  AlertDiamondIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { mapItemCsv } from "@/components/admin-panel/warehouses/csv/utils/map-csv"
import type { Item } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import type { CsvRowType } from "../warehouses/csv/utils/types"
import { AdminAssortmentTable } from "./assortment-table"
import { ItemDialog, type ItemFormData } from "./item-dialog"

// Mock data for initial items
const MOCK_ITEMS: Item[] = [
  {
    id: "item-1",
    name: "Mleko 3,2%",
    qrCode: "5901234567890",
    imageUrl: "/images/mleko.jpg",
    minTemp: 2,
    maxTemp: 6,
    weight: 1.0,
    width: 70,
    height: 200,
    depth: 70,
    comment: "Przechowywać w lodówce",
    daysToExpiry: 14,
    isDangerous: false,
  },
  {
    id: "item-2",
    name: "Lody waniliowe",
    qrCode: "5909876543210",
    imageUrl: "/images/lody.jpg",
    minTemp: -18,
    maxTemp: -12,
    weight: 0.5,
    width: 150,
    height: 100,
    depth: 80,
    comment: "Produkt mrożony",
    daysToExpiry: 180,
    isDangerous: false,
  },
  {
    id: "item-3",
    name: "Aceton techniczny",
    qrCode: "QR-ACETON-001",
    imageUrl: null,
    minTemp: 10,
    maxTemp: 25,
    weight: 2.5,
    width: 300,
    height: 200,
    depth: 150,
    comment: "Substancja łatwopalna",
    daysToExpiry: 365,
    isDangerous: true,
  },
]

export default function AssortmentMain() {
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | undefined>(undefined)
  const { addItemDialogOpen, closeAddItemDialog } = useVoiceCommandStore()

  useEffect(() => {
    if (addItemDialogOpen) {
      setSelectedItem(undefined)
      setDialogOpen(true)
      closeAddItemDialog()
    }
  }, [addItemDialogOpen, closeAddItemDialog])

  const handleAddItem = () => {
    setSelectedItem(undefined)
    setDialogOpen(true)
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDeleteItem = (item: Item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id))
      setItemToDelete(undefined)
    }
  }

  const handleSubmit = (data: ItemFormData) => {
    if (selectedItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, ...data } : item
        )
      )
    } else {
      const newItem: Item = {
        ...data,
        id: crypto.randomUUID(),
        qrCode: data.id || crypto.randomUUID(),
      }
      setItems((prev) => [...prev, newItem])
    }
  }

  const handleCsvImport = (data: CsvRowType<"item">[]) => {
    const newItems = mapItemCsv(data)
    setItems((prev) => [...prev, ...newItems])
  }

  // Calculate stats
  const dangerousCount = items.filter((i) => i.isDangerous).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CsvImporter onImport={handleCsvImport} type="item" />
            <Button onClick={handleAddItem}>
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              Dodaj przedmiot
            </Button>
          </div>
        }
        description="Zarządzaj katalogiem przedmiotów magazynowych"
        icon={Package}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Asortyment"
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold text-primary">
              {items.length}
            </span>
            <span className="text-muted-foreground text-xs">przedmiotów</span>
          </div>
          {dangerousCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 backdrop-blur-sm">
              <HugeiconsIcon
                className="size-3.5 text-destructive"
                icon={AlertDiamondIcon}
              />
              <span className="font-mono font-semibold text-destructive">
                {dangerousCount}
              </span>
              <span className="text-destructive/80 text-xs">
                niebezpiecznych
              </span>
            </div>
          )}
        </div>
      </AdminPageHeader>

      {/* Items Table */}
      <AdminAssortmentTable
        items={items}
        onDelete={handleDeleteItem}
        onEdit={handleEditItem}
      />

      {/* Dialogs */}
      <ItemDialog
        currentRow={selectedItem}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć przedmiot "${itemToDelete?.name}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteItem}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń przedmiot"
      />
    </div>
  )
}
