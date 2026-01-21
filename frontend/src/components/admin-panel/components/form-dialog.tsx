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
import { cn } from "@/lib/utils"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  formId: string
  submitLabel: string
  children: React.ReactNode
  onFormReset?: () => void
  contentClassName?: string
  showSeparator?: boolean
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitLabel,
  children,
  onFormReset,
  contentClassName,
  showSeparator = true,
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
        {showSeparator && <Separator />}
        <div className={cn("py-1", contentClassName)}>{children}</div>
        <DialogFooter>
          <Button form={formId} type="submit">
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
