import {
  AlertCircleIcon,
  Search01Icon,
  Tick02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useCallback, useEffect, useRef } from "react"
import { remToPixels } from "@/components/dashboard/utils/helpers"
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

  if (isPending) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30">
        <Spinner className="size-5" />
        <p className="text-muted-foreground text-sm">Ładowanie magazynów...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 border-dashed bg-destructive/5">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <HugeiconsIcon
            className="size-5 text-destructive"
            icon={AlertCircleIcon}
          />
        </span>
        <p className="text-center text-destructive text-sm">
          Nie udało się pobrać listy magazynów.
        </p>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-5 text-muted-foreground"
            icon={Search01Icon}
          />
        </span>
        <p className="text-center text-muted-foreground text-sm">
          Nie znaleziono magazynów.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea
      className="rounded-lg border"
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
            const isFirst = virtualItem.index === 0
            const isLast = virtualItem.index === warehouses.length - 1

            return (
              <Button
                className={cn(
                  "absolute top-0 left-0 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  !isLast && "border-b",
                  isFirst && "rounded-t-lg",
                  isLast && "rounded-b-lg",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/20 ring-inset"
                    : "hover:bg-muted/50"
                )}
                key={warehouse.id}
                onClick={() => onWarehouseSelect(warehouse)}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                variant="ghost"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon
                    className="size-4"
                    icon={isSelected ? Tick02Icon : WarehouseIcon}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium text-sm",
                      isSelected && "text-primary"
                    )}
                  >
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
