import type React from "react"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FileUploader } from "./file-uploader"

interface CsvImporterProps {
  children: React.ReactNode
  className?: string
}

export function CsvImporter({
  children,
  className,
  ...props
}: CsvImporterProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "preview">("upload")
  const [files, setFiles] = useState<File[]>([])

  const handleUpload = async (_uploadedFiles: File[]) => {
    // TODO: Process CSV files
    await Promise.resolve()
    setStep("preview")
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className={cn("w-fit", className)} {...props}>
        {children}
      </DialogTrigger>
      {step === "upload" ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importuj CSV</DialogTitle>
            <DialogDescription>
              Wybierz i upuść plik CSV lub kliknij aby wybrać plik z dysku.
            </DialogDescription>
          </DialogHeader>
          <FileUploader
            accept={{ "text/csv": [".csv"] }}
            maxFileCount={1}
            onUpload={handleUpload}
            onValueChange={setFiles}
            value={files}
          />
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Podgląd danych</DialogTitle>
            <DialogDescription>Sprawdź dane przed importem.</DialogDescription>
          </DialogHeader>
          {/* TODO: Add CSV preview table */}
        </DialogContent>
      )}
    </Dialog>
  )
}
