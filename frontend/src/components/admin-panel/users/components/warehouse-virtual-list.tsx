import { useVirtualizer } from "@tanstack/react-virtual"
import { useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const SCROLL_THRESHOLD_PX = 200
const ITEM_HEIGHT_PX = 52

interface WarehouseVirtualListProps {
  warehouses: Warehouse[]
  selectedWarehouse: Warehouse | null
  onWarehouseSelect: (warehouse: Warehouse) => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isPending: boolean
  isError: boolean
}

export function WarehouseVirtualList({
  warehouses,
  selectedWarehouse,
  onWarehouseSelect,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isPending,
  isError,
}: WarehouseVirtualListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: warehouses.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_HEIGHT_PX,
    overscan: 5,
  })

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!(el && hasNextPage) || isFetchingNextPage) {
      return
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < SCROLL_THRESHOLD_PX) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    el.addEventListener("scroll", handleScroll)
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const remToPixels = (rem: number) => {
    return (
      rem *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    )
  }
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-destructive text-sm">
        Nie udało się pobrać listy magazynów.
      </p>
    )
  }

  if (warehouses.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        Nie znaleziono magazynów.
      </p>
    )
  }

  return (
    <ScrollArea
      className="rounded-md border"
      ref={scrollRef}
      style={{
        height: Math.min(
          remToPixels(16),
          rowVirtualizer.getTotalSize() + remToPixels(0.2)
        ),
      }}
    >
      {isPending || isError ? null : (
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const warehouse = warehouses[virtualItem.index]
            const isSelected = selectedWarehouse?.id === warehouse.id

            return (
              <Button
                className={cn(
                  "absolute top-0 left-0 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left",
                  isSelected && "bg-primary/10 text-primary"
                )}
                key={warehouse.id}
                onClick={() => onWarehouseSelect(warehouse)}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                variant="ghost"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {warehouse.name}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {warehouse.racksCount} regałów &middot;{" "}
                    {warehouse.occupancy}% zajętości
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
      )}

      {isFetchingNextPage ? (
        <div className="flex items-center justify-center border-t py-3">
          <Spinner className="size-4" />
        </div>
      ) : null}
    </ScrollArea>
  )
}
