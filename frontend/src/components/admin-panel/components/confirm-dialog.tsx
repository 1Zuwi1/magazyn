"use client"

import { Alert01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"
            )}
          >
            <HugeiconsIcon className="size-5" icon={Alert01Icon} />
          </div>
          <div className="space-y-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Anuluj
          </Button>
          <Button onClick={handleConfirm} variant="destructive">
            Potwierdź
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
