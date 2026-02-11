"use client"

import { Add01Icon, GridIcon, Package } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { Button } from "@/components/ui/button"
import { ErrorEmptyState, FilterEmptyState } from "@/components/ui/empty-state"
import PaginationFull from "@/components/ui/pagination-component"
import { Skeleton } from "@/components/ui/skeleton"
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
import type { RackFormData } from "../csv/utils/types"
import { RackDialog } from "./rack-dialog"
import { RackGrid } from "./racks-grid"

interface AdminRacksPageProps {
  warehouse: {
    name: string
  }
}

const buildRackMutationData = ({
  acceptsDangerous,
  data,
  warehouseId,
}: {
  acceptsDangerous: boolean
  data: RackFormData
  warehouseId: number
}) => {
  return {
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
  const t = useTranslations()

  const router = useRouter()
  const { warehouseIdForQuery, isHydrated, isMissingWarehouseId } =
    useCurrentAdminWarehouseId()
  const warehouseName = warehouse.name
  const {
    data: apiWarehouse,
    isPending: isWarehousePending,
    isError: isWarehouseError,
    refetch: refetchWarehouse,
  } = useWarehouses({ warehouseId: warehouseIdForQuery })

  const [page, setPage] = useState(0)

  const {
    data: racksData,
    isPending: isRacksPending,
    isError: isRacksError,
    refetch: refetchRacks,
  } = useRacks({
    page,
    warehouseId: apiWarehouse?.id ?? -1,
  })
  const createRackMutation = useCreateRack()
  const updateRackMutation = useUpdateRack()
  const deleteRackMutation = useDeleteRack()
  const importRacksMutation = useImportRacks()

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
      throw new Error(
        t("generated.admin.warehouses.warehouseIdRequiredCreateUpdate")
      )
    }

    if (selectedRack === undefined) {
      await createRackMutation.mutateAsync(
        buildRackMutationData({
          acceptsDangerous: data.acceptsDangerous,
          data,
          warehouseId: apiWarehouse.id,
        })
      )
      return
    }

    await updateRackMutation.mutateAsync({
      rackId: selectedRack.id,
      data: buildRackMutationData({
        acceptsDangerous: data.acceptsDangerous,
        data,
        warehouseId: apiWarehouse.id,
      }),
    })

    setSelectedRack(undefined)
  }

  const handleCsvImport = async ({ file }: { file: File }) => {
    const report = await importRacksMutation.mutateAsync({
      file,
      warehouseId: apiWarehouse?.id ?? -1,
    })
    if (report.errors.length > 0) {
      toast.warning(
        t("generated.admin.shared.importPartiallyCompleted", {
          value0: report.imported.toString(),
          value1: report.processedLines.toString(),
        })
      )
      return
    }

    toast.success(
      t("generated.admin.warehouses.imported", {
        value0: report.imported,
      })
    )
  }

  const totalItems =
    racksData?.content.reduce((acc, rack) => acc + rack.occupiedSlots, 0) ?? 0
  const totalRacks = racksData?.totalElements ?? 0
  const totalPages = racksData?.totalPages ?? 0
  const currentPage = page + 1
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
      <FilterEmptyState
        description={`Nie znaleziono magazynu o nazwie: ${warehouseName}`}
      />
    )
  } else if (isWarehouseError || isRacksError) {
    racksContent = (
      <div className="overflow-hidden rounded-2xl border border-dashed">
        <ErrorEmptyState
          onRetry={() => {
            if (isWarehouseError) {
              refetchWarehouse()
            }

            if (isRacksError) {
              refetchRacks()
            }
          }}
        />
      </div>
    )
  } else if (isLoading) {
    racksContent = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            className="rounded-2xl border bg-card p-5"
            key={`skeleton-${i.toString()}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  } else {
    racksContent = (
      <RackGrid
        onDelete={handleDeleteRack}
        onEdit={handleEditRack}
        racks={racksData?.content ?? []}
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
              {t("generated.admin.warehouses.addRack")}
            </Button>
          </div>
        }
        backTitle={t("generated.admin.warehouses.returnWarehouses")}
        description={t("generated.admin.warehouses.manageRacksWarehouse", {
          value0: warehouseName,
        })}
        icon={GridIcon}
        onBack={handleBack}
        title={t("generated.shared.racks2")}
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={GridIcon}
            />
            <span className="font-mono font-semibold text-primary">
              {totalRacks}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("generated.admin.warehouses.racks")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold">{totalItems}</span>
            <span className="text-muted-foreground text-xs">
              {t("generated.admin.shared.items")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs">
              {t("generated.admin.warehouses.totalWeight")}
            </span>
            <span className="font-mono font-semibold">
              {t("generated.admin.warehouses.kg2", {
                value0: (racksData?.summary.totalWeight ?? 0).toString(),
              })}
            </span>
          </div>
        </div>
      </AdminPageHeader>

      {/* Rack Grid */}
      {racksContent}

      {/* Pagination */}
      <PaginationFull
        currentPage={currentPage}
        setPage={setPage}
        totalPages={totalPages}
      />

      {/* Dialogs */}
      <RackDialog
        currentRow={selectedRack}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={t(
          "generated.admin.warehouses.sureWantDeleteRackOperation",
          {
            value0: rackToDelete?.marker,
          }
        )}
        onConfirm={confirmDeleteRack}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={t("generated.admin.warehouses.deleteRack")}
      />
    </div>
  )
}
