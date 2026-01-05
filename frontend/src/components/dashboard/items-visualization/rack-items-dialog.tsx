"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Item, Rack } from "../types"
import { RackItemsStats } from "./rack-items-stats"
import { RackItemsTable } from "./rack-items-table"

interface RackItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rack: Rack | null
}

export function RackItemsDialog({
  open,
  onOpenChange,
  rack,
}: RackItemsDialogProps) {
  if (!rack) {
    return null
  }

  const items = rack.items.filter(
    (item): item is NonNullable<Item> => item !== null
  )
  const occupiedSlots = items.length

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden sm:h-auto sm:max-w-[85vw] lg:max-w-5xl xl:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{rack.name}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <RackItemsStats occupiedSlots={occupiedSlots} rack={rack} />
          <div className="min-h-0 flex-1">
            <RackItemsTable items={items} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
