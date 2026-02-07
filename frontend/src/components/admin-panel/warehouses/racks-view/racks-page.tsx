"use client"

import {
  Add01Icon,
  ArrowLeft02Icon,
  GridIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { type ReactNode, useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import type { Rack } from "@/components/dashboard/types"
import { Button, buttonVariants } from "@/components/ui/button"
import useRacks, {
  type RacksList,
  useCreateRack,
  useDeleteRack,
  useUpdateRack,
} from "@/hooks/use-racks"
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
const CREATE_RACK_TEMP_ID = 0
const DEFAULT_ACCEPTS_DANGEROUS_ITEMS = false

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
  }
}

const getRackId = (rack: Rack): number | null => {
  const rackId = Number.parseInt(rack.id, 10)
  return Number.isNaN(rackId) ? null : rackId
}

const buildRackMutationData = ({
  acceptsDangerous,
  data,
  rackId,
  warehouseId,
}: {
  acceptsDangerous: boolean
  data: RackFormData
  rackId: number
  warehouseId: number
}) => {
  return {
    id: rackId,
    marker: data.marker,
    warehouseId,
    comment: data.comment ?? null,
    sizeX: data.cols,
    sizeY: data.rows,
    maxTemp: data.maxTemp,
    minTemp: data.minTemp,
    maxWeight: data.maxWeight,
    maxSizeX: data.maxItemWidth,
    maxSizeY: data.maxItemHeight,
    maxSizeZ: data.maxItemDepth,
    acceptsDangerous,
  }
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
  const createRackMutation = useCreateRack()
  const updateRackMutation = useUpdateRack()
  const deleteRackMutation = useDeleteRack()

  const mappedRacks = useMemo(() => {
    if (!apiWarehouse) {
      return []
    }

    return (racksData?.content ?? [])
      .filter((rack) => rack.warehouseId === apiWarehouse.id)
      .map(mapApiRackToViewModel)
  }, [apiWarehouse, racksData?.content])

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
    if (!rackToDelete) {
      return
    }

    const rackId = getRackId(rackToDelete)
    if (rackId !== null) {
      deleteRackMutation.mutate(rackId)
    }

    setRackToDelete(undefined)
  }

  const handleSubmit = async (data: RackFormData) => {
    if (!apiWarehouse) {
      throw new Error("Warehouse ID is required to create or update a rack.")
    }

    if (selectedRack === undefined) {
      await createRackMutation.mutateAsync(
        buildRackMutationData({
          acceptsDangerous: DEFAULT_ACCEPTS_DANGEROUS_ITEMS,
          data,
          rackId: CREATE_RACK_TEMP_ID,
          warehouseId: apiWarehouse.id,
        })
      )
      return
    }

    const selectedRackId = getRackId(selectedRack)
    if (selectedRackId === null) {
      throw new Error("Rack ID is invalid.")
    }

    const selectedApiRack = racksData?.content.find(
      (rack) => rack.id === selectedRackId
    )

    await updateRackMutation.mutateAsync({
      rackId: selectedRackId,
      data: buildRackMutationData({
        acceptsDangerous:
          selectedApiRack?.acceptsDangerous ?? DEFAULT_ACCEPTS_DANGEROUS_ITEMS,
        data,
        rackId: selectedRackId,
        warehouseId: selectedApiRack?.warehouseId ?? apiWarehouse.id,
      }),
    })

    setSelectedRack(undefined)
  }

  const handleCsvImport = (data: CsvRowType<"rack">[]) => {
    if (!apiWarehouse) {
      return
    }

    for (const row of data) {
      createRackMutation.mutate(
        buildRackMutationData({
          acceptsDangerous: DEFAULT_ACCEPTS_DANGEROUS_ITEMS,
          data: row,
          rackId: CREATE_RACK_TEMP_ID,
          warehouseId: apiWarehouse.id,
        })
      )
    }
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
        racks={mappedRacks}
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
            <Button
              disabled={apiWarehouse === undefined}
              onClick={handleAddRack}
            >
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
              {mappedRacks.length}
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
