"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useAssortments from "@/hooks/use-assortment"
import type { Rack } from "@/lib/schemas"
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
  const {
    data: assortments,
    isLoading,
    isError,
    refetch,
  } = useAssortments(
    { rackId: rack?.id ?? -1 },
    {
      enabled: open && rack !== null,
    }
  )

  if (!rack) {
    return null
  }

  const occupiedSlots = assortments?.totalElements ?? 0

  const renderDialogContent = () => {
    if (isLoading) {
      return <RackItemsDialogSkeleton />
    }

    if (isError) {
      return <ErrorEmptyState onRetry={() => refetch()} />
    }

    return (
      <>
        <RackItemsStats occupiedSlots={occupiedSlots} rack={rack} />
        <div className="min-h-0 flex-1">
          <RackItemsTable items={assortments?.content ?? []} />
        </div>
      </>
    )
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-[95vw] flex-col overflow-hidden sm:h-auto sm:max-w-[85vw] lg:max-w-5xl xl:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{rack.marker}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {renderDialogContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RackItemsDialogSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton
            className="h-16 w-full"
            key={`skeleton-row-${i.toString()}`}
          />
        ))}
      </div>
    </>
  )
}
