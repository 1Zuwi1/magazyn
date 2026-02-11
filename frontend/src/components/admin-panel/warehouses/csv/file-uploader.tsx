"use client"

import {
  Cancel01Icon,
  CloudUploadIcon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useCallback, useEffect, useRef, useState } from "react"
import Dropzone, { type FileRejection } from "react-dropzone"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { formatBytes } from "../../lib/utils"
import { DEFAULT_CONFIG } from "./utils/constants"

interface FileWithPreview extends File {
  preview: string
}

interface FileUploaderProps {
  value?: File[]
  onValueChange?: (files: File[]) => void
  onUpload?: (files: File[]) => boolean | Promise<boolean>
  disabled?: boolean
  maxFileSizeInBytes?: number
}

export function FileUploader({
  value,
  onValueChange,
  onUpload,
  disabled = false,
  maxFileSizeInBytes = DEFAULT_CONFIG.maxSizeInBytes,
}: FileUploaderProps) {
  const t = useAppTranslations()

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const previousFilesRef = useRef<FileWithPreview[]>([])

  useEffect(() => {
    if (value) {
      const filesWithPreview = value.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )
      setFiles(filesWithPreview)
    }
  }, [value])

  useEffect(() => {
    const previousFiles = previousFilesRef.current
    const currentPreviews = new Set(files.map((file) => file.preview))

    for (const previousFile of previousFiles) {
      if (!currentPreviews.has(previousFile.preview)) {
        URL.revokeObjectURL(previousFile.preview)
      }
    }

    previousFilesRef.current = files
  }, [files])

  useEffect(() => {
    return () => {
      for (const file of previousFilesRef.current) {
        URL.revokeObjectURL(file.preview)
      }
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > DEFAULT_CONFIG.maxFileCount) {
        toast.error(
          t("generated.admin.warehouses.uploadMaximumFileS", {
            value0: DEFAULT_CONFIG.maxFileCount,
          })
        )
        return
      }

      if (files.length + acceptedFiles.length > DEFAULT_CONFIG.maxFileCount) {
        toast.error(
          t("generated.admin.warehouses.uploadMaximumFileS", {
            value0: DEFAULT_CONFIG.maxFileCount,
          })
        )
        return
      }

      for (const rejection of rejectedFiles) {
        const errors = rejection.errors.map((e) => e.message).join(", ")
        toast.error(
          t("generated.admin.warehouses.formattedValue", {
            value0: rejection.file.name,
            value1: errors,
          })
        )
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onValueChange?.(updatedFiles)

      if (onUpload && updatedFiles.length <= DEFAULT_CONFIG.maxFileCount) {
        let isUploadSuccessful = true
        setIsUploading(true)
        try {
          isUploadSuccessful = await onUpload(updatedFiles)
        } catch {
          isUploadSuccessful = false
          toast.error(t("generated.admin.warehouses.fileFailedProcess"))
        } finally {
          setIsUploading(false)
        }

        if (!isUploadSuccessful) {
          for (const uploadedFile of updatedFiles) {
            URL.revokeObjectURL(uploadedFile.preview)
          }
          setFiles([])
          onValueChange?.([])
        }
      }
    },
    [files, onUpload, onValueChange, t]
  )

  const removeFile = useCallback(
    (fileName: string) => {
      const fileToRemove = files.find((f) => f.name === fileName)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      const newFiles = files.filter((f) => f.name !== fileName)
      setFiles(newFiles)
      onValueChange?.(newFiles)
    },
    [files, onValueChange]
  )

  const isDisabled = disabled || files.length >= DEFAULT_CONFIG.maxFileCount

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept={DEFAULT_CONFIG.accept}
        disabled={isDisabled}
        maxFiles={DEFAULT_CONFIG.maxFileCount}
        maxSize={maxFileSizeInBytes}
        onDrop={onDrop}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2"
            )}
          >
            <input {...getInputProps()} />
            <div className="rounded-full border border-dashed p-3">
              <HugeiconsIcon
                className="size-7 text-muted-foreground"
                icon={CloudUploadIcon}
              />
            </div>
            {isDragActive ? (
              <p className="font-medium text-muted-foreground">
                {t("generated.admin.warehouses.dropFileHere")}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="font-medium text-muted-foreground">
                  {t("generated.admin.warehouses.clickDropCsvFile")}
                </p>
              </div>
            )}
          </div>
        )}
      </Dropzone>

      {files.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="flex flex-col gap-3">
            {files.map((file) => (
              <div
                className="flex items-center gap-3 rounded-md border p-3"
                key={file.name}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                  <HugeiconsIcon
                    className="size-5 text-muted-foreground"
                    icon={File01Icon}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate font-medium text-sm">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(file.size)}
                  </p>
                  {isUploading && <Progress className="h-1" value={100} />}
                </div>
                <Button
                  disabled={isUploading}
                  onClick={() => removeFile(file.name)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  <span className="sr-only">
                    {t("generated.admin.warehouses.deleteFile")}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
