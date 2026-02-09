"use client"

import {
  Add01Icon,
  AlertDiamondIcon,
  Package,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { CsvImporter } from "@/components/admin-panel/warehouses/csv/csv-importer"
import type { Item as DashboardItem } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import useItems, {
  type Item as ApiItem,
  useCreateItem,
  useDeleteItem,
  useImportItems,
  useUpdateItem,
} from "@/hooks/use-items"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import { ItemDialog, type ItemFormData, PhotoPromptDialog } from "./item-dialog"
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

export default function ItemsMain() {
  const [page, setPage] = useState(1)
  const {
    data: itemsData,
    isPending: isItemsPending,
    isError: isItemsError,
    refetch: refetchItems,
  } = useItems({ page: page - 1 })

  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()
  const importItemsMutation = useImportItems()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DashboardItem | undefined>(
    undefined
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DashboardItem | undefined>(
    undefined
  )
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [photoItem, setPhotoItem] = useState<DashboardItem | undefined>(
    undefined
  )

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

  const handleEditItem = (item: DashboardItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDeleteItem = (item: DashboardItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleUploadPhoto = (item: DashboardItem) => {
    setPhotoItem(item)
    setPhotoDialogOpen(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) {
      return
    }

    const itemId = itemToDelete.id

    await deleteItemMutation.mutateAsync(itemId)
    toast.success("Usunięto przedmiot")
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
      toast.success("Zaktualizowano przedmiot")
      setSelectedItem(undefined)
      return undefined
    }

    const created = await createItemMutation.mutateAsync(
      buildItemMutationData(data)
    )
    toast.success("Dodano nowy przedmiot")
    setSelectedItem(undefined)
    return created.id
  }

  const handleCsvImport = async ({ file }: { file: File }) => {
    const report = await importItemsMutation.mutateAsync(file)
    if (report.errors.length > 0) {
      toast.warning(
        `Import zakończony częściowo: ${report.imported}/${report.processedLines}`
      )
      return
    }

    toast.success(`Zaimportowano ${report.imported} produktów`)
  }

  const dangerousCount = items.filter((i) => i.isDangerous).length
  const isMutating =
    createItemMutation.isPending ||
    updateItemMutation.isPending ||
    deleteItemMutation.isPending

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CsvImporter
              isImporting={importItemsMutation.isPending}
              onImport={handleCsvImport}
              type="item"
            />
            <Button disabled={isMutating} onClick={handleAddItem}>
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
        title="Przedmioty"
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

      <AdminItemsTable
        currentPage={page}
        isError={isItemsError}
        isLoading={isItemsPending}
        items={items}
        onDelete={handleDeleteItem}
        onEdit={handleEditItem}
        onSetPage={handleSetPage}
        onUploadPhoto={handleUploadPhoto}
        refetch={refetchItems}
        totalPages={totalPages}
      />

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

      <PhotoPromptDialog
        hasExistingPhoto
        itemId={photoItem ? Number(photoItem.id) : null}
        onOpenChange={setPhotoDialogOpen}
        open={photoDialogOpen}
      />
    </div>
  )
}
