import type React from "react"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CsvImporterProps {
  children: React.ReactNode
  className?: string
}

export function CsvImporter({ children, className }: CsvImporterProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger className={cn("w-fit", className)}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importuj CSV</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
