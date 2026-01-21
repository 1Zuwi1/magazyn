"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onFormReset?: () => void
  formId?: string
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onFormReset,
  formId,
}: FormDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onFormReset?.()
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <Separator />
        <div className="py-1">{children}</div>
        <DialogFooter>
          <Button form={formId} type="submit">
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
