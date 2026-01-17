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
import { formatBytes } from "@/components/admin-panel/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: File[]
  onValueChange?: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  progresses?: Record<string, number>

  accept?: DropzoneProps["accept"]

  maxSize?: DropzoneProps["maxSize"]

  maxFileCount?: DropzoneProps["maxFiles"]

  multiple?: boolean

  disabled?: boolean
}

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = {
      "text/csv": [".csv"],
    },
    maxSize = 1024 * 1024 * 2,
    maxFileCount = 1,
    multiple = false,
    disabled = false,
    className,
    ...dropzoneProps
  } = props

  const [files, setFiles] = useState<File[]>(valueProp ?? [])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Nie można przesłać więcej niż 1 pliku na raz")
        return
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        toast.error(`Nie można przesłać więcej niż ${maxFileCount} plików`)
        return
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      const updatedFiles = files ? [...files, ...newFiles] : newFiles

      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        for (const { file, errors } of rejectedFiles) {
          const errorMessages = errors.map((e) => e.message).join(", ")
          toast.error(`Plik ${file.name} został odrzucony: ${errorMessages}`)
        }
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFileCount
      ) {
        const target =
          updatedFiles.length > 1 ? `${updatedFiles.length} plików` : "plik"

        toast.promise(onUpload(updatedFiles), {
          loading: `Przesyłanie ${target}...`,
          success: () => {
            setFiles([])
            return `${target.charAt(0).toUpperCase() + target.slice(1)} przesłany`
          },
          error: `Nie udało się przesłać ${target}`,
        })
      }
    },
    [files, maxFileCount, multiple, onUpload]
  )

  function onRemove(index: number) {
    if (!files) {
      return
    }
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onValueChange?.(newFiles)
  }

  useEffect(() => {
    return () => {
      if (!files) {
        return
      }
      for (const file of files) {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview)
        }
      }
    }
  }, [files])

  const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        accept={accept}
        disabled={isDisabled}
        maxFiles={maxFileCount}
        maxSize={maxSize}
        multiple={maxFileCount > 1 || multiple}
        onDrop={onDrop}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-muted-foreground/25 border-dashed px-5 py-2.5 text-center transition hover:bg-muted/25",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragActive && "border-muted-foreground/50",
              isDisabled && "pointer-events-none opacity-60",
              className
            )}
            {...dropzoneProps}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-7 text-muted-foreground"
                    icon={CloudUploadIcon}
                  />
                </div>
                <p className="font-medium text-muted-foreground">
                  Upuść pliki tutaj
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-7 text-muted-foreground"
                    icon={CloudUploadIcon}
                  />
                </div>
                <div className="flex flex-col gap-px">
                  <p className="font-medium text-muted-foreground">
                    Przeciągnij i upuść pliki tutaj lub kliknij aby wybrać
                  </p>
                  <p className="text-muted-foreground/70 text-sm">
                    {maxFileCount > 1
                      ? `Możesz przesłać ${maxFileCount === Number.POSITIVE_INFINITY ? "wiele" : maxFileCount} plików (do ${formatBytes(maxSize)} każdy)`
                      : `Możesz przesłać plik do ${formatBytes(maxSize)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
      {files?.length ? (
        <ScrollArea className="h-fit w-full px-3">
          <div className="flex max-h-48 flex-col gap-4">
            {files.map((file, index) => (
              <FileCard
                file={file}
                key={file.name}
                onRemove={() => onRemove(index)}
                progress={progresses?.[file.name]}
              />
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </div>
  )
}

interface FileCardProps {
  file: File
  onRemove: () => void
  progress?: number
}

function FileCard({ file, progress, onRemove }: FileCardProps) {
  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex flex-1 gap-2.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-5 text-muted-foreground"
            icon={File01Icon}
          />
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px">
            <p className="line-clamp-1 font-medium text-foreground/80 text-sm">
              {file.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(file.size)}
            </p>
          </div>
          {progress !== undefined ? <Progress value={progress} /> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onRemove}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <HugeiconsIcon
            aria-hidden="true"
            className="size-4"
            icon={Cancel01Icon}
          />
          <span className="sr-only">Usuń plik</span>
        </Button>
      </div>
    </div>
  )
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string"
}
