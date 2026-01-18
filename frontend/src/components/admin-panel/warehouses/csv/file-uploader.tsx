"use client"

import {
  Cancel01Icon,
  CloudUploadIcon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useState } from "react"
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) {
    return "0 B"
  }
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

interface FileWithPreview extends File {
  preview: string
}

interface FileUploaderProps {
  value?: File[]
  onValueChange?: (files: File[]) => void
  onUpload?: (files: File[]) => void | Promise<void>
  accept?: DropzoneProps["accept"]
  maxSize?: number
  maxFileCount?: number
  disabled?: boolean
  className?: string
}

export function FileUploader({
  value,
  onValueChange,
  onUpload,
  accept = { "text/csv": [".csv"] },
  maxSize = 1024 * 1024 * 4,
  maxFileCount = 1,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (value) {
      const filesWithPreview = value.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )
      setFiles(filesWithPreview)
    }
  }, [value])

  useEffect(() => {
    return () => {
      for (const file of files) {
        URL.revokeObjectURL(file.preview)
      }
    }
  }, [files])

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > maxFileCount) {
        toast.error(`Możesz przesłać maksymalnie ${maxFileCount} plik(ów)`)
        return
      }

      if (files.length + acceptedFiles.length > maxFileCount) {
        toast.error(`Możesz przesłać maksymalnie ${maxFileCount} plik(ów)`)
        return
      }

      for (const rejection of rejectedFiles) {
        const errors = rejection.errors.map((e) => e.message).join(", ")
        toast.error(`${rejection.file.name}: ${errors}`)
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onValueChange?.(updatedFiles)

      if (onUpload && updatedFiles.length <= maxFileCount) {
        setIsUploading(true)
        try {
          await onUpload(updatedFiles)
        } catch {
          toast.error("Nie udało się przetworzyć pliku")
        } finally {
          setIsUploading(false)
        }
      }
    },
    [files, maxFileCount, onUpload, onValueChange]
  )

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      URL.revokeObjectURL(files[index].preview)
      setFiles(newFiles)
      onValueChange?.(newFiles)
    },
    [files, onValueChange]
  )

  const isDisabled = disabled || files.length >= maxFileCount

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept={accept}
        disabled={isDisabled}
        maxFiles={maxFileCount}
        maxSize={maxSize}
        onDrop={onDrop}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-muted-foreground/25 border-dashed px-4 py-6 text-center transition hover:bg-muted/25",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragActive && "border-primary/50 bg-muted/25",
              isDisabled && "pointer-events-none opacity-60",
              className
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
                Upuść plik tutaj
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="font-medium text-muted-foreground">
                  Kliknij lub upuść plik CSV
                </p>
                <p className="text-muted-foreground/70 text-sm">
                  Maksymalny rozmiar: {formatBytes(maxSize)}
                </p>
              </div>
            )}
          </div>
        )}
      </Dropzone>

      {files.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="flex flex-col gap-3">
            {files.map((file, index) => (
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
                  onClick={() => removeFile(index)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  <span className="sr-only">Usuń plik</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
