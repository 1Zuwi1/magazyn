"use client"

import {
  Add01Icon,
  Alert02Icon,
  Package,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { type ReactNode, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import { Button } from "@/components/ui/button"
import PaginationFull from "@/components/ui/pagination-component"
import { Skeleton } from "@/components/ui/skeleton"
import useWarehouses, {
  useCreateWarehouse,
  useDeleteWarehouse,
  useImportWarehouses,
  useUpdateWarehouse,
  type WarehousesList,
} from "@/hooks/use-warehouses"
import { translateMessage } from "@/i18n/translate-message"
import { AdminPageHeader } from "../components/admin-page-header"
import { getAdminNavLinks } from "../lib/constants"
import { WarehouseCard } from "./components/warehouse-card"
import {
  WarehouseDialog,
  type WarehouseFormData,
} from "./components/warehouse-dialog"

type ApiWarehouse = WarehousesList["content"][number]

export default function WarehousesMain() {
  const [page, setPage] = useState(1)
  const {
    data: warehousesData,
    isPending: isWarehousesPending,
    isError: isWarehousesError,
  } = useWarehouses({
    page: page - 1,
  })
  const warehouses = warehousesData?.content ?? []
  const createWarehouseMutation = useCreateWarehouse()
  const updateWarehouseMutation = useUpdateWarehouse()
  const deleteWarehouseMutation = useDeleteWarehouse()
  const importWarehousesMutation = useImportWarehouses()
  const [open, setOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<ApiWarehouse>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<ApiWarehouse>()

  const handleAddWarehouse = () => {
    setSelectedWarehouse(undefined)
    setOpen(true)
  }
  const handleEditWarehouse = (warehouse: ApiWarehouse) => {
    setSelectedWarehouse(warehouse)
    setOpen(true)
  }

  const handleDeleteWarehouse = (warehouse: ApiWarehouse) => {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteWarehouse = async () => {
    if (!warehouseToDelete) {
      return
    }

    await deleteWarehouseMutation.mutateAsync(warehouseToDelete.id)
    setWarehouseToDelete(undefined)
  }

  const handleSubmit = async (data: WarehouseFormData) => {
    if (selectedWarehouse) {
      await updateWarehouseMutation.mutateAsync({
        warehouseId: selectedWarehouse.id,
        name: data.name,
      })
    } else {
      await createWarehouseMutation.mutateAsync(data.name)
    }

    setSelectedWarehouse(undefined)
  }

  const handleCsvImport = async ({ file }: { file: File }) => {
    const report = await importWarehousesMutation.mutateAsync(file)
    if (report.errors.length > 0) {
      toast.warning(
        translateMessage("generated.m0220", {
          value0: report.imported,
          value1: report.processedLines,
        })
      )
      return
    }

    toast.success(
      translateMessage("generated.m0387", { value0: report.imported })
    )
  }

  const totalWarehouses = warehousesData?.totalElements
  const totalCapacity = warehousesData?.summary.totalCapacity
  const totalUsed = warehousesData?.summary.occupiedSlots
  const totalRacks = warehousesData?.summary.totalRacks
  let warehousesContent: ReactNode

  if (isWarehousesPending) {
    warehousesContent = (
      <div className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="overflow-hidden rounded-xl border bg-card"
            key={i}
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="border-t p-5">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  } else if (isWarehousesError) {
    warehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-destructive/5 py-16">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <HugeiconsIcon
            className="size-7 text-destructive"
            icon={Alert02Icon}
          />
        </div>
        <p className="mt-4 font-medium text-foreground">
          {translateMessage("generated.m0388")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {translateMessage("generated.m0389")}
        </p>
        <Button
          className="mt-4"
          onClick={() => window.location.reload()}
          variant="outline"
        >
          {translateMessage("generated.m0075")}
        </Button>
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
        <p className="mt-4 font-medium text-foreground">
          {translateMessage("generated.m0390")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {translateMessage("generated.m0391")}
        </p>
        <Button className="mt-4" onClick={handleAddWarehouse}>
          <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
          {translateMessage("generated.m0392")}
        </Button>
      </div>
    )
  } else {
    warehousesContent = (
      <div className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 gap-4">
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
    <div className="@container space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CsvImporter
              isImporting={importWarehousesMutation.isPending}
              onImport={handleCsvImport}
              type="warehouse"
            />
            <Button onClick={handleAddWarehouse}>
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              {translateMessage("generated.m0392")}
            </Button>
          </div>
        }
        description={translateMessage("generated.m0393")}
        icon={WarehouseIcon}
        navLinks={getAdminNavLinks().map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title={translateMessage("generated.m0886")}
      >
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {totalWarehouses}
            </span>
            <span className="text-muted-foreground text-xs">
              {translateMessage("generated.m0294")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold">{totalRacks}</span>
            <span className="text-muted-foreground text-xs">
              {translateMessage("generated.m0241")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs">
              {translateMessage("generated.m0394")}
            </span>
            <span className="font-mono font-semibold">
              {(totalCapacity ?? 0) > 0
                ? Math.round(((totalUsed ?? 0) / (totalCapacity ?? 1)) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </AdminPageHeader>

      {/* Warehouse Grid */}
      {warehousesContent}

      <PaginationFull
        currentPage={page}
        setPage={setPage}
        totalPages={warehousesData ? warehousesData.totalPages : 1}
      />

      {/* Dialogs */}
      <WarehouseDialog
        currentRow={
          selectedWarehouse
            ? { id: String(selectedWarehouse.id), name: selectedWarehouse.name }
            : undefined
        }
        formId="warehouse-form"
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        open={open}
      />

      <ConfirmDialog
        description={translateMessage("generated.m0395", {
          value0: warehouseToDelete?.name,
        })}
        onConfirm={confirmDeleteWarehouse}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={translateMessage("generated.m0396")}
      />
    </div>
  )
}
