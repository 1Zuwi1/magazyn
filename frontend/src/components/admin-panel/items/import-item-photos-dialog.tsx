"use client"

import { Cancel01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type ChangeEvent, type FormEvent, useState } from "react"
import { formatBytes } from "@/components/admin-panel/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppTranslations } from "@/i18n/use-translations"

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp"

interface SelectedPhoto {
  id: string
  file: File
}

interface ImportItemPhotosDialogProps {
  isImporting?: boolean
  onImport: (files: File[]) => Promise<void> | void
  onOpenChange: (open: boolean) => void
  open: boolean
}

const buildPhotoId = (file: File): string =>
  `${file.name}-${file.size}-${file.lastModified}`

export function ImportItemPhotosDialog({
  isImporting = false,
  onImport,
  onOpenChange,
  open,
}: ImportItemPhotosDialogProps) {
  const t = useAppTranslations()

  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])

  const resetSelection = () => {
    setSelectedPhotos([])
  }

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetSelection()
    }
    onOpenChange(isOpen)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? [])
    if (incomingFiles.length === 0) {
      return
    }

    setSelectedPhotos((currentPhotos) => {
      const existingIds = new Set(currentPhotos.map((photo) => photo.id))
      const nextPhotos = [...currentPhotos]

      for (const file of incomingFiles) {
        const photoId = buildPhotoId(file)
        if (existingIds.has(photoId)) {
          continue
        }
        nextPhotos.push({ id: photoId, file })
        existingIds.add(photoId)
      }

      return nextPhotos
    })

    event.target.value = ""
  }

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotos((currentPhotos) =>
      currentPhotos.filter((photo) => photo.id !== photoId)
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedPhotos.length === 0 || isImporting) {
      return
    }

    await onImport(selectedPhotos.map((photo) => photo.file))
    resetSelection()
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {t("generated.admin.items.importPhotosTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("generated.admin.items.importPhotosDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-4">
              <Label
                className="mb-2 inline-flex items-center gap-2 font-medium"
                htmlFor="import-item-photos-input"
              >
                <HugeiconsIcon
                  className="size-4 text-muted-foreground"
                  icon={ImageUploadIcon}
                />
                {t("generated.admin.items.selectPhotos")}
              </Label>
              <Input
                accept={ACCEPTED_IMAGE_TYPES}
                id="import-item-photos-input"
                multiple
                onChange={handleFileChange}
                type="file"
              />
              <p className="mt-2 text-muted-foreground text-xs">
                {t("generated.admin.items.supportedPhotoFormats")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">
                {t("generated.admin.items.selectedPhotosCount", {
                  value0: selectedPhotos.length,
                })}
              </p>
              {selectedPhotos.length > 0 ? (
                <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {selectedPhotos.map((photo) => (
                    <li
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                      key={photo.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {photo.file.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatBytes(photo.file.size)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRemovePhoto(photo.id)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                        <span className="sr-only">
                          {t("generated.admin.items.removeSelectedPhoto", {
                            value0: photo.file.name,
                          })}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("generated.admin.items.noPhotosSelected")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleDialogOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t("generated.shared.cancel")}
            </Button>
            <Button
              disabled={isImporting || selectedPhotos.length === 0}
              type="submit"
            >
              {t("generated.admin.items.importPhotosAction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
