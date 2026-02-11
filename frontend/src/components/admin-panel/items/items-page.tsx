"use client"

import {
  Add01Icon,
  AlertDiamondIcon,
  Package,
  Photo,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import type { Item as DashboardItem } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import useItems, {
  type Item as ApiItem,
  useBatchUploadItemPhotos,
  useCreateItem,
  useDeleteItem,
  useImportItems,
  useUpdateItem,
} from "@/hooks/use-items"
import type { AppTranslate } from "@/i18n/use-translations"
import { AdminPageHeader } from "../components/admin-page-header"
import { ImportItemPhotosDialog } from "./import-item-photos-dialog"
import { ItemDialog, type ItemFormData } from "./item-dialog"
import { AdminItemsTable } from "./items-table"

const mapApiItemToViewModel = (item: ApiItem): DashboardItem => {
  return {
    id: item.id,
    name: item.name,
    qrCode: item.code,
    imageUrl: item.photoUrl,
    minTemp: item.minTemp,
    maxTemp: item.maxTemp,
    weight: item.weight,
    width: item.sizeX,
    height: item.sizeY,
    depth: item.sizeZ,
    comment: item.comment ?? undefined,
    daysToExpiry: item.expireAfterDays,
    isDangerous: item.dangerous,
  }
}

const buildItemMutationData = (data: ItemFormData) => {
  const trimmedName = data.name.trim()
  const trimmedComment = data.comment?.trim()

  return {
    name: trimmedName.length > 0 ? trimmedName : undefined,
    minTemp: data.minTemp,
    maxTemp: data.maxTemp,
    weight: data.weight,
    sizeX: data.width,
    sizeY: data.height,
    sizeZ: data.depth,
    comment:
      trimmedComment && trimmedComment.length > 0 ? trimmedComment : undefined,
    expireAfterDays: data.daysToExpiry,
    dangerous: data.isDangerous,
  }
}

const BATCH_IMPORT_ERROR_LIMIT = 3
const BATCH_IMPORT_FALLBACK_CODE_MAP = {
  NOT_FOUND: "RESOURCE_NOT_FOUND",
} as const

const formatBatchPhotoImportError = (
  value: string,
  t: AppTranslate
): string => {
  const [firstPart, ...restParts] = value.split(":")
  const rawCode = firstPart?.trim()
  const details = restParts.join(":").trim()

  if (!rawCode) {
    return value
  }

  const fallbackCode =
    BATCH_IMPORT_FALLBACK_CODE_MAP[
      rawCode as keyof typeof BATCH_IMPORT_FALLBACK_CODE_MAP
    ]
  let translationKey: string | undefined
  if (t.has(`errorCodes.${rawCode}`)) {
    translationKey = rawCode
  } else if (fallbackCode && t.has(`errorCodes.${fallbackCode}`)) {
    translationKey = fallbackCode
  }
  const translatedCode = translationKey
    ? t(`errorCodes.${translationKey}`)
    : rawCode

  return details.length > 0 ? `${translatedCode}: ${details}` : translatedCode
}

export default function ItemsMain() {
  const t = useTranslations()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  })
  const searchQuery = debouncedSearch.trim()
  const {
    data: itemsData,
    isPending: isItemsPending,
    isError: isItemsError,
    refetch: refetchItems,
  } = useItems({
    page: page - 1,
    search: searchQuery || undefined,
  })
  const { data: dangerousItemsData } = useItems({ size: 1, dangerous: true })

  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()
  const importItemsMutation = useImportItems()
  const batchUploadItemPhotosMutation = useBatchUploadItemPhotos()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DashboardItem | undefined>(
    undefined
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DashboardItem | undefined>(
    undefined
  )
  const [importPhotosDialogOpen, setImportPhotosDialogOpen] = useState(false)

  const items = useMemo(() => {
    return (itemsData?.content ?? []).map(mapApiItemToViewModel)
  }, [itemsData?.content])
  const totalPages = Math.max(itemsData?.totalPages ?? 1, 1)
  const totalItemsCount = itemsData?.totalElements ?? 0

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleAddItem = () => {
    setSelectedItem(undefined)
    setDialogOpen(true)
  }

  const handleSetPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)
    setPage(boundedPage)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDeleteItem = (item: DashboardItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleOpenImportPhotosDialog = () => {
    setImportPhotosDialogOpen(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) {
      return
    }

    const itemId = itemToDelete.id

    await deleteItemMutation.mutateAsync(itemId)
    toast.success(t("generated.admin.items.itemRemoved"))
    setItemToDelete(undefined)
  }

  const handleSubmit = async (
    data: ItemFormData
  ): Promise<number | undefined> => {
    if (selectedItem) {
      const itemId = selectedItem.id

      await updateItemMutation.mutateAsync({
        itemId,
        ...buildItemMutationData(data),
      })
      toast.success(t("generated.admin.items.itemUpdated"))
      setSelectedItem(undefined)
      return undefined
    }

    const created = await createItemMutation.mutateAsync(
      buildItemMutationData(data)
    )
    toast.success(t("generated.admin.items.newItemAdded"))
    setSelectedItem(undefined)
    return created.id
  }

  const handleCsvImport = async ({ file }: { file: File }) => {
    const report = await importItemsMutation.mutateAsync(file)
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
      t("generated.admin.items.imported", {
        value0: report.imported,
      })
    )
  }

  const handlePhotosImport = async (files: File[]): Promise<void> => {
    const output = await batchUploadItemPhotosMutation.mutateAsync({ files })
    const importErrors = output
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    if (importErrors.length > 0) {
      const importedCount = Math.max(files.length - importErrors.length, 0)
      toast.warning(
        t("generated.admin.shared.importPartiallyCompleted", {
          value0: importedCount.toString(),
          value1: files.length.toString(),
        })
      )

      const visibleErrors = importErrors
        .slice(0, BATCH_IMPORT_ERROR_LIMIT)
        .map((value) => formatBatchPhotoImportError(value, t))
      const hiddenErrorsCount = importErrors.length - visibleErrors.length
      const warningMessage =
        hiddenErrorsCount > 0
          ? `${visibleErrors.join("\n")}\n${t("generated.admin.shared.more", {
              value0: hiddenErrorsCount.toString(),
            })}`
          : visibleErrors.join("\n")

      toast.warning(warningMessage)
      return
    }

    toast.success(
      t("generated.admin.items.imported", {
        value0: files.length,
      })
    )
  }

  const dangerousCount = dangerousItemsData?.totalElements ?? 0
  const isMutating =
    createItemMutation.isPending ||
    updateItemMutation.isPending ||
    deleteItemMutation.isPending

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleOpenImportPhotosDialog}>
              <HugeiconsIcon className="mr-2 size-4" icon={Photo} />
              {t("generated.admin.items.importPhotos")}
            </Button>
            <CsvImporter
              isImporting={importItemsMutation.isPending}
              onImport={handleCsvImport}
              type="item"
            />
            <Button disabled={isMutating} onClick={handleAddItem}>
              <HugeiconsIcon className="mr-2 size-4" icon={Add01Icon} />
              {t("generated.admin.items.addItem")}
            </Button>
          </div>
        }
        description={t("generated.admin.items.manageCatalogInventoryItems")}
        icon={Package}
        title={t("generated.shared.items")}
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={Package}
            />
            <span className="font-mono font-semibold text-primary">
              {totalItemsCount}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("generated.admin.shared.items")}
            </span>
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
                {t("generated.admin.items.dangerous")}
              </span>
            </div>
          )}
        </div>
      </AdminPageHeader>

      <AdminItemsTable
        currentPage={page}
        debouncedSearch={searchQuery}
        isError={isItemsError}
        isLoading={isItemsPending}
        items={items}
        onDelete={handleDeleteItem}
        onSearchChange={handleSearchChange}
        onSetPage={handleSetPage}
        refetch={refetchItems}
        search={search}
        totalPages={totalPages}
      />

      <ItemDialog
        currentRow={selectedItem}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />

      <ConfirmDialog
        description={t("generated.admin.items.sureWantDeleteItemOperation", {
          value0: itemToDelete?.name ?? "",
        })}
        onConfirm={confirmDeleteItem}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={t("generated.admin.items.deleteItem")}
      />

      <ImportItemPhotosDialog
        isImporting={batchUploadItemPhotosMutation.isPending}
        onImport={handlePhotosImport}
        onOpenChange={setImportPhotosDialogOpen}
        open={importPhotosDialogOpen}
      />
    </div>
  )
}
