"use client"

import { Add01Icon, GridIcon, Package } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { type ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { Button } from "@/components/ui/button"
import { useCurrentAdminWarehouseId } from "@/hooks/use-current-admin-warehouse-id"
import useRacks, {
  useCreateRack,
  useDeleteRack,
  useImportRacks,
  useUpdateRack,
} from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import type { Rack } from "@/lib/schemas"
import { AdminPageHeader } from "../../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../../lib/constants"
import type { RackFormData } from "../csv/utils/types"
import { RackDialog } from "./rack-dialog"
import { RackGrid } from "./racks-grid"

interface AdminRacksPageProps {
  warehouse: {
    name: string
  }
}

const RACKS_PAGE_SIZE = 2000
const CREATE_RACK_TEMP_ID = 0
const DEFAULT_ACCEPTS_DANGEROUS_ITEMS = false

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
  const router = useRouter()
  const { warehouseIdForQuery, isHydrated, isMissingWarehouseId } =
    useCurrentAdminWarehouseId()
  const warehouseName = warehouse.name
  const {
    data: apiWarehouse,
    isPending: isWarehousePending,
    isError: isWarehouseError,
  } = useWarehouses({ warehouseId: warehouseIdForQuery })

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
  const importRacksMutation = useImportRacks()

  const mappedRacks = useMemo(() => {
    if (!apiWarehouse) {
      return []
    }

    return (racksData?.content ?? []).filter(
      (rack) => rack.warehouseId === apiWarehouse.id
    )
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

    const rackId = rackToDelete.id
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

    const selectedRackId = selectedRack.id
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

  const handleCsvImport = async ({ file }: { file: File }) => {
    const report = await importRacksMutation.mutateAsync(file)
    if (report.errors.length > 0) {
      toast.warning(
        `Import zakończony częściowo: ${report.imported}/${report.processedLines}`
      )
      return
    }

    toast.success(`Zaimportowano ${report.imported} regałów`)
  }

  const totalItems = mappedRacks.reduce(
    (acc, rack) => acc + rack.occupiedSlots,
    0
  )
  const isWarehouseMissing =
    isHydrated &&
    !isWarehousePending &&
    !isWarehouseError &&
    apiWarehouse == null
  const isLoading =
    !isHydrated ||
    isWarehousePending ||
    (apiWarehouse != null && isRacksPending)
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push("/admin/warehouses")
  }
  let racksContent: ReactNode

  if (isMissingWarehouseId) {
    return null
  }

  if (isWarehouseMissing) {
    racksContent = (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
        Nie znaleziono magazynu o nazwie: {warehouseName}
      </div>
    )
  } else if (isWarehouseError || isRacksError) {
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
            <CsvImporter
              isImporting={importRacksMutation.isPending}
              onImport={handleCsvImport}
              type="rack"
            />
            <Button disabled={apiWarehouse == null} onClick={handleAddRack}>
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              Dodaj regał
            </Button>
          </div>
        }
        backTitle="Wróć do magazynów"
        description={`Zarządzaj regałami w magazynie ${warehouseName}`}
        icon={GridIcon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        onBack={handleBack}
        title="Regały"
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
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
          {/* <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs">Łączna waga:</span>
            <span className="font-mono font-semibold">{totalWeight} kg</span>
          </div> */}
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
