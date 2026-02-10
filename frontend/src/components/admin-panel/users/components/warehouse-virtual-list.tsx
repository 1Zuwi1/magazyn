import {
  AlertCircleIcon,
  Search01Icon,
  Tick02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { remToPixels } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useAppTranslations } from "@/i18n/use-translations"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const SCROLL_THRESHOLD_PX = 200
const ITEM_HEIGHT_PX = 52

interface WarehouseVirtualListProps {
  warehouses: Warehouse[]
  assignedWarehouseIds: number[]
  selectedWarehouseIds: number[]
  onWarehouseToggle: (warehouse: Warehouse) => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isPending: boolean
  isError: boolean
}

const getRowSurfaceClass = ({
  isAssigned,
  isSelected,
}: {
  isAssigned: boolean
  isSelected: boolean
}): string => {
  if (isSelected) {
    return "bg-primary/10 ring-1 ring-primary/20 ring-inset"
  }

  if (isAssigned) {
    return "bg-emerald-500/5 hover:bg-emerald-500/10"
  }

  return "hover:bg-muted/50"
}

const getRowIconClass = ({
  isAssigned,
  isSelected,
}: {
  isAssigned: boolean
  isSelected: boolean
}): string => {
  if (isSelected) {
    return "bg-primary text-primary-foreground"
  }

  if (isAssigned) {
    return "bg-emerald-500/15 text-emerald-600"
  }

  return "bg-muted text-muted-foreground"
}

const getRowNameClass = ({
  isAssigned,
  isSelected,
}: {
  isAssigned: boolean
  isSelected: boolean
}): string => {
  if (isSelected) {
    return "text-primary"
  }

  if (isAssigned) {
    return "text-emerald-700"
  }

  return ""
}

interface WarehouseRowProps {
  warehouse: Warehouse
  isAssigned: boolean
  isFirst: boolean
  isLast: boolean
  isSelected: boolean
  onToggle: (warehouse: Warehouse) => void
  rowHeight: number
  rowOffset: number
}

function WarehouseRow({
  warehouse,
  isAssigned,
  isFirst,
  isLast,
  isSelected,
  onToggle,
  rowHeight,
  rowOffset,
}: WarehouseRowProps) {
  const t = useAppTranslations()

  const rowSurfaceClass = getRowSurfaceClass({ isAssigned, isSelected })
  const rowIconClass = getRowIconClass({ isAssigned, isSelected })
  const rowNameClass = getRowNameClass({ isAssigned, isSelected })
  const isMarked = isSelected || isAssigned

  return (
    <Button
      className={cn(
        "absolute top-0 left-0 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
        !isLast && "border-b",
        isFirst && "rounded-t-lg",
        isLast && "rounded-b-lg",
        rowSurfaceClass
      )}
      onClick={() => onToggle(warehouse)}
      style={{
        height: `${rowHeight}px`,
        transform: `translateY(${rowOffset}px)`,
      }}
      variant="ghost"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          rowIconClass
        )}
      >
        <HugeiconsIcon
          className="size-4"
          icon={isMarked ? Tick02Icon : WarehouseIcon}
          strokeWidth={isMarked ? 2.5 : 1.5}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium text-sm", rowNameClass)}>
          {warehouse.name}
        </p>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {t("generated.admin.users.racksOccupancy", {
            value0: warehouse.racksCount,
            value1: warehouse.occupancy,
          })}
        </p>
      </div>
      {isAssigned ? (
        <Badge className="shrink-0" variant="secondary">
          {t("generated.admin.users.assigned")}
        </Badge>
      ) : null}
    </Button>
  )
}

export function WarehouseVirtualList({
  warehouses,
  assignedWarehouseIds,
  selectedWarehouseIds,
  onWarehouseToggle,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isPending,
  isError,
}: WarehouseVirtualListProps) {
  const t = useAppTranslations()

  const scrollRef = useRef<HTMLDivElement>(null)
  const assignedWarehouseIdSet = useMemo(
    () => new Set(assignedWarehouseIds),
    [assignedWarehouseIds]
  )
  const selectedWarehouseIdSet = useMemo(
    () => new Set(selectedWarehouseIds),
    [selectedWarehouseIds]
  )

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
      <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            key={`skeleton-${i.toString()}`}
          >
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
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
          {t("generated.admin.users.failedRetrieveWarehouseList")}
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
          {t("generated.admin.users.warehousesFound")}
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
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const warehouse = warehouses[virtualItem.index]
          const isSelected = selectedWarehouseIdSet.has(warehouse.id)
          const isAssigned = assignedWarehouseIdSet.has(warehouse.id)
          const isFirst = virtualItem.index === 0
          const isLast = virtualItem.index === warehouses.length - 1

          return (
            <WarehouseRow
              isAssigned={isAssigned}
              isFirst={isFirst}
              isLast={isLast}
              isSelected={isSelected}
              key={warehouse.id}
              onToggle={onWarehouseToggle}
              rowHeight={virtualItem.size}
              rowOffset={virtualItem.start}
              warehouse={warehouse}
            />
          )
        })}
      </div>

      {isFetchingNextPage ? (
        <div className="flex items-center justify-center border-t py-3">
          <Spinner className="size-4" />
        </div>
      ) : null}
    </ScrollArea>
  )
}
