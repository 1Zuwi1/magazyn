"use client"

import {
  Add01Icon,
  ArrowLeft02Icon,
  GridIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { mapRackCsv } from "@/components/admin-panel/warehouses/csv/utils/map-csv"
import type { Rack } from "@/components/dashboard/types"
import { Button, buttonVariants } from "@/components/ui/button"
import useRacks, { type RacksList } from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../../lib/constants"
import type { CsvRowType, RackFormData } from "../csv/utils/types"
import { RackDialog } from "./rack-dialog"
import { RackGrid } from "./racks-grid"

interface AdminRacksPageProps {
  warehouse: {
    name: string
  }
}

const WAREHOUSES_PAGE_SIZE = 1000
const RACKS_PAGE_SIZE = 2000
const MAX_MOCK_ITEMS_PER_RACK = 12

type ApiRack = RacksList["content"][number]

const mapApiRackToViewModel = (rack: ApiRack): Rack => {
  const rows = Math.max(1, rack.sizeY)
  const cols = Math.max(1, rack.sizeX)
  const totalSlots = rows * cols
  const occupancy = Math.min(100, 25 + (rack.id % 60))
  const mockItemsCount = Math.min(
    MAX_MOCK_ITEMS_PER_RACK,
    Math.round((occupancy / 100) * totalSlots)
  )

  return {
    id: String(rack.id),
    marker: rack.marker,
    name: rack.marker ?? `Regał ${rack.id}`,
    rows,
    cols,
    minTemp: rack.minTemp,
    maxTemp: rack.maxTemp,
    maxWeight: rack.maxWeight,
    currentWeight: Math.round((rack.maxWeight * occupancy) / 100),
    maxItemWidth: rack.maxSizeX,
    maxItemHeight: rack.maxSizeY,
    maxItemDepth: rack.maxSizeZ,
    comment: rack.comment,
    occupancy,
    // There is no items endpoint yet - keep deterministic mocked occupancy/items.
    items: Array.from({ length: mockItemsCount }, () => null),
  } as Rack
}

export default function AdminRacksPage({ warehouse }: AdminRacksPageProps) {
  const warehouseName = warehouse.name
  const {
    data: warehousesData,
    isPending: isWarehousesPending,
    isError: isWarehousesError,
  } = useWarehouses({ page: 0, size: WAREHOUSES_PAGE_SIZE })

  const apiWarehouse = useMemo(
    () =>
      warehousesData?.content.find(
        (candidate) =>
          candidate.name.toLocaleLowerCase() ===
          warehouseName.toLocaleLowerCase()
      ),
    [warehouseName, warehousesData?.content]
  )

  const {
    data: racksData,
    isPending: isRacksPending,
    isError: isRacksError,
  } = useRacks({
    page: 0,
    size: RACKS_PAGE_SIZE,
    warehouseId: apiWarehouse?.id ?? -1,
  })

  const mappedRacks = useMemo(() => {
    if (!apiWarehouse) {
      return []
    }

    return (racksData?.content ?? [])
      .filter((rack) => rack.warehouseId === apiWarehouse.id)
      .map(mapApiRackToViewModel)
  }, [apiWarehouse, racksData?.content])

  const [racks, setRacks] = useState<Rack[]>(mappedRacks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRack, setSelectedRack] = useState<Rack | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rackToDelete, setRackToDelete] = useState<Rack | undefined>(undefined)

  useEffect(() => {
    setRacks(mappedRacks)
  }, [mappedRacks])

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
        id: crypto.randomUUID(),
        marker: data.marker,
        rows: data.rows,
        cols: data.cols,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        maxWeight: data.maxWeight,
        currentWeight: 0,
        maxItemWidth: data.maxItemWidth,
        maxItemHeight: data.maxItemHeight,
        maxItemDepth: data.maxItemDepth,
        comment: data.comment ?? null,
        occupancy: 0,
        items: [],
      }
      return setRacks((prev) => [...prev, newRack])
    }
    setRacks((prev) =>
      prev.map((rack) =>
        rack.id === selectedRack.id
          ? {
              ...rack,
              marker: data.marker,
              name: data.name,
              rows: data.rows,
              cols: data.cols,
              minTemp: data.minTemp,
              maxTemp: data.maxTemp,
              maxWeight: data.maxWeight,
              maxItemWidth: data.maxItemWidth,
              maxItemHeight: data.maxItemHeight,
              maxItemDepth: data.maxItemDepth,
              comment: data.comment ?? null,
            }
          : rack
      )
    )
  }

  const handleCsvImport = (data: CsvRowType<"rack">[]) => {
    const newRacks = mapRackCsv(data)
    setRacks((prev) => [...prev, ...newRacks])
  }

  const totalWeight = mappedRacks.reduce(
    (acc, rack) => acc + rack.currentWeight,
    0
  )
  const totalItems = mappedRacks.reduce(
    (acc, rack) => acc + rack.items.length,
    0
  )
  const isWarehouseMissing = !isWarehousesPending && apiWarehouse === undefined
  const isLoading =
    isWarehousesPending || (apiWarehouse !== undefined && isRacksPending)
  let racksContent: ReactNode

  if (isWarehouseMissing) {
    racksContent = (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
        Nie znaleziono magazynu o nazwie: {warehouseName}
      </div>
    )
  } else if (isWarehousesError || isRacksError) {
    racksContent = (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
        Nie udało się pobrać regałów.
      </div>
    )
  } else if (isLoading) {
    racksContent = (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
        Ładowanie regałów...
      </div>
    )
  } else {
    racksContent = (
      <RackGrid
        onDelete={handleDeleteRack}
        onEdit={handleEditRack}
        racks={racks}
      />
    )
  }

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
        description={`Zarządzaj regałami w magazynie ${warehouseName}`}
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
              {apiWarehouse?.racksCount ?? racks.length}
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
      {racksContent}

      {/* Dialogs */}
      <RackDialog
        currentRow={selectedRack}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć regał "${rackToDelete?.marker}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteRack}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Usuń regał"
      />
    </div>
  )
}
