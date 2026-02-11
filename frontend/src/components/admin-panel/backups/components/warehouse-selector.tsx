"use client"

import {
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { remToPixels } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import useWarehouses, { useInfiniteWarehouses } from "@/hooks/use-warehouses"
import { useAppTranslations } from "@/i18n/use-translations"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const SCROLL_THRESHOLD_PX = 180
const WAREHOUSE_ROW_HEIGHT_PX = 40

interface WarehouseSelectorProps {
  id?: string
  value: number | null
  onValueChange: (
    warehouseId: number | null,
    warehouseName: string | null
  ) => void
  includeAllOption?: boolean
  allOptionLabel?: string
  excludedWarehouseIds?: readonly number[]
  disabled?: boolean
  placeholder?: string
  triggerClassName?: string
}

interface WarehouseOptionButtonProps {
  warehouse: Warehouse | null
  allOptionLabel: string
  rowHeight: number
  rowOffset: number
  selectedWarehouseId: number | null
  onSelect: (warehouse: Warehouse | null) => void
}

function WarehouseOptionButton({
  warehouse,
  allOptionLabel,
  rowHeight,
  rowOffset,
  selectedWarehouseId,
  onSelect,
}: WarehouseOptionButtonProps) {
  const isAllOption = warehouse == null
  const isSelected = isAllOption
    ? selectedWarehouseId == null
    : warehouse.id === selectedWarehouseId
  const optionLabel = isAllOption ? allOptionLabel : warehouse.name
  const icon = isSelected ? Tick02Icon : WarehouseIcon

  return (
    <Button
      className={cn(
        "absolute top-0 left-0 h-10 w-full justify-start rounded-none border-b px-3 font-normal",
        isSelected && "bg-primary/10 font-medium text-primary"
      )}
      onClick={() => {
        onSelect(warehouse)
      }}
      style={{
        height: `${rowHeight}px`,
        transform: `translateY(${rowOffset}px)`,
      }}
      type="button"
      variant="ghost"
    >
      <HugeiconsIcon
        className={cn(
          "mr-2 size-4 text-muted-foreground",
          isSelected && "text-primary"
        )}
        icon={icon}
      />
      <span className="truncate">{optionLabel}</span>
    </Button>
  )
}

const getWarehouseForIndex = ({
  includeAllOption,
  index,
  warehouses,
}: {
  includeAllOption: boolean
  index: number
  warehouses: Warehouse[]
}): Warehouse | null => {
  if (!includeAllOption) {
    return warehouses[index] ?? null
  }

  if (index === 0) {
    return null
  }

  return warehouses[index - 1] ?? null
}

const getOptionKey = ({
  includeAllOption,
  index,
  warehouse,
}: {
  includeAllOption: boolean
  index: number
  warehouse: Warehouse | null
}): string => {
  if (includeAllOption && index === 0) {
    return "all-warehouses"
  }

  return `warehouse-option-${warehouse?.id ?? index}`
}

function SelectorState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed px-3 py-6 text-center text-muted-foreground text-sm">
      {children}
    </div>
  )
}

export function WarehouseSelector({
  id,
  value,
  onValueChange,
  includeAllOption = false,
  allOptionLabel,
  excludedWarehouseIds = [],
  disabled = false,
  placeholder,
  triggerClassName,
}: WarehouseSelectorProps) {
  const t = useAppTranslations()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 400,
  })

  const resolvedAllOptionLabel =
    allOptionLabel ?? t("generated.admin.backups.allWarehouses")

  const { data: selectedWarehouse } = useWarehouses(
    {
      warehouseId: value ?? -1,
    },
    {
      enabled: value != null,
      staleTime: 60_000,
    }
  )
  const {
    warehouses,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteWarehouses(
    {
      nameFilter: debouncedSearch,
    },
    {
      enabled: open,
    }
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const excludedWarehouseIdSet = useMemo(
    () => new Set(excludedWarehouseIds),
    [excludedWarehouseIds]
  )

  const visibleWarehouses = useMemo(
    () =>
      warehouses.filter(
        (warehouse) =>
          warehouse.id === value || !excludedWarehouseIdSet.has(warehouse.id)
      ),
    [excludedWarehouseIdSet, value, warehouses]
  )

  const optionsCount = visibleWarehouses.length + (includeAllOption ? 1 : 0)

  const rowVirtualizer = useVirtualizer({
    count: optionsCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => WAREHOUSE_ROW_HEIGHT_PX,
    overscan: 6,
  })

  const selectedWarehouseName =
    value == null
      ? null
      : (visibleWarehouses.find((warehouse) => warehouse.id === value)?.name ??
        selectedWarehouse?.name ??
        null)
  const triggerLabel = (() => {
    if (value == null) {
      if (includeAllOption) {
        return resolvedAllOptionLabel
      }

      return placeholder ?? t("generated.shared.searchWarehouse")
    }

    return (
      selectedWarehouseName ?? placeholder ?? t("generated.shared.warehouse")
    )
  })()

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setSearch("")
    }
  }

  const handleScroll = useCallback(() => {
    const scrollElement = scrollRef.current

    if (!(scrollElement && hasNextPage) || isFetchingNextPage) {
      return
    }

    const distanceFromBottom =
      scrollElement.scrollHeight -
      scrollElement.scrollTop -
      scrollElement.clientHeight

    if (distanceFromBottom < SCROLL_THRESHOLD_PX) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (!scrollElement) {
      return
    }

    scrollElement.addEventListener("scroll", handleScroll)

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const handleSelectWarehouse = (warehouse: Warehouse | null) => {
    if (!warehouse) {
      onValueChange(null, null)
      handleOpenChange(false)
      return
    }

    onValueChange(warehouse.id, warehouse.name)
    handleOpenChange(false)
  }

  const renderSelectorContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 py-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              className="h-9 w-full"
              key={`warehouse-skeleton-${index.toString()}`}
            />
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <SelectorState>
          {t("generated.admin.users.failedRetrieveWarehouseList")}
        </SelectorState>
      )
    }

    if (optionsCount === 0) {
      return (
        <SelectorState>
          {t("generated.admin.users.warehousesFound")}
        </SelectorState>
      )
    }

    return (
      <ScrollArea
        className="rounded-md border"
        ref={scrollRef}
        style={{
          height: Math.min(
            remToPixels(15),
            rowVirtualizer.getTotalSize() + remToPixels(0.25)
          ),
        }}
      >
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const warehouse = getWarehouseForIndex({
              includeAllOption,
              index: virtualRow.index,
              warehouses: visibleWarehouses,
            })

            return (
              <WarehouseOptionButton
                allOptionLabel={resolvedAllOptionLabel}
                key={getOptionKey({
                  includeAllOption,
                  index: virtualRow.index,
                  warehouse,
                })}
                onSelect={handleSelectWarehouse}
                rowHeight={virtualRow.size}
                rowOffset={virtualRow.start}
                selectedWarehouseId={value}
                warehouse={warehouse}
              />
            )
          })}
        </div>

        {isFetchingNextPage ? (
          <div className="flex items-center justify-center border-t py-2.5">
            <Spinner className="size-4" />
          </div>
        ) : null}
      </ScrollArea>
    )
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        render={
          <Button
            className={cn(
              "w-full justify-between font-normal",
              value == null && "text-muted-foreground",
              triggerClassName
            )}
            disabled={disabled}
            id={id}
            type="button"
            variant="outline"
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <HugeiconsIcon className="size-4 shrink-0" icon={ArrowDown01Icon} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[21rem] gap-2 p-2"
        sideOffset={6}
      >
        <div className="relative">
          <HugeiconsIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
          />
          <Input
            autoComplete="off"
            className="pl-9"
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder={placeholder ?? t("generated.shared.searchWarehouse")}
            type="text"
            value={search}
          />
        </div>

        {renderSelectorContent()}
      </PopoverContent>
    </Popover>
  )
}
