"use client"

import {
  Building06Icon,
  Search01Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { AdminUser } from "@/hooks/use-admin-users"
import {
  useInfiniteWarehouses,
  useMultipleWarehouses,
} from "@/hooks/use-warehouses"
import { translateMessage } from "@/i18n/translate-message"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { normalizeValue } from "../lib/user-utils"
import { WarehouseVirtualList } from "./warehouse-virtual-list"

interface WarehouseAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | undefined
  onAssign: (params: { userId: number; warehouseId: number }) => void
  onRemove: (params: { userId: number; warehouseId: number }) => void
}

interface UseWarehouseAssignmentListStateParams {
  assignedWarehouseIds: number[]
  debouncedSearch: string
  open: boolean
  showAssignedOnly: boolean
}

function useWarehouseAssignmentListState({
  assignedWarehouseIds,
  debouncedSearch,
  open,
  showAssignedOnly,
}: UseWarehouseAssignmentListStateParams) {
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase()
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
  const assignedWarehouseQueries = useMultipleWarehouses({
    warehouseIds: showAssignedOnly ? assignedWarehouseIds : [],
  })
  const assignedWarehouses = useMemo(
    () =>
      assignedWarehouseQueries.flatMap((assignedWarehouseQuery) =>
        assignedWarehouseQuery.data ? [assignedWarehouseQuery.data] : []
      ),
    [assignedWarehouseQueries]
  )
  const filteredAssignedWarehouses = useMemo(() => {
    if (!normalizedSearch) {
      return assignedWarehouses
    }

    return assignedWarehouses.filter((warehouse) =>
      warehouse.name.toLocaleLowerCase().includes(normalizedSearch)
    )
  }, [assignedWarehouses, normalizedSearch])
  const visibleWarehouses = showAssignedOnly
    ? filteredAssignedWarehouses
    : warehouses
  const isAssignedWarehousesPending = assignedWarehouseQueries.some(
    (assignedWarehouseQuery) => assignedWarehouseQuery.isPending
  )
  const isAssignedWarehousesError = assignedWarehouseQueries.some(
    (assignedWarehouseQuery) => assignedWarehouseQuery.isError
  )
  const isListPending = showAssignedOnly
    ? isAssignedWarehousesPending
    : isLoading
  const isListError = showAssignedOnly ? isAssignedWarehousesError : isError
  const fetchNextWarehouses = useCallback(() => {
    if (showAssignedOnly) {
      return
    }

    fetchNextPage()
  }, [fetchNextPage, showAssignedOnly])

  return {
    fetchNextWarehouses,
    hasNextPage: showAssignedOnly ? false : hasNextPage,
    isFetchingNextPage: showAssignedOnly ? false : isFetchingNextPage,
    isListError,
    isListPending,
    visibleWarehouses,
  }
}

export function WarehouseAssignmentDialog({
  open,
  onOpenChange,
  user,
  onAssign,
  onRemove,
}: WarehouseAssignmentDialogProps) {
  const [search, setSearch] = useState("")
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>([])
  const [lastSelectedWarehouse, setLastSelectedWarehouse] =
    useState<Warehouse | null>(null)
  const assignedWarehouseIds = user?.warehouse_ids ?? []
  const assignedWarehouseIdSet = useMemo(
    () => new Set(assignedWarehouseIds),
    [assignedWarehouseIds]
  )
  const selectedAssignedWarehouseIds = selectedWarehouseIds.filter(
    (warehouseId) => assignedWarehouseIdSet.has(warehouseId)
  )
  const selectedUnassignedWarehouseIds = selectedWarehouseIds.filter(
    (warehouseId) => !assignedWarehouseIdSet.has(warehouseId)
  )
  const canAssignSelectedWarehouses = Boolean(
    user && selectedUnassignedWarehouseIds.length > 0
  )
  const canRemoveSelectedWarehouses = Boolean(
    user && selectedAssignedWarehouseIds.length > 0
  )

  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  })
  const {
    fetchNextWarehouses,
    hasNextPage: hasNextVisibleWarehousesPage,
    isFetchingNextPage: isFetchingVisibleWarehousesNextPage,
    isListError,
    isListPending,
    visibleWarehouses,
  } = useWarehouseAssignmentListState({
    assignedWarehouseIds,
    debouncedSearch,
    open,
    showAssignedOnly,
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearch("")
      setShowAssignedOnly(false)
      setSelectedWarehouseIds([])
      setLastSelectedWarehouse(null)
    }
    onOpenChange(isOpen)
  }

  const handleWarehouseToggle = (warehouse: Warehouse) => {
    setSelectedWarehouseIds((currentSelectedWarehouseIds) => {
      if (currentSelectedWarehouseIds.includes(warehouse.id)) {
        return currentSelectedWarehouseIds.filter(
          (warehouseId) => warehouseId !== warehouse.id
        )
      }

      return [...currentSelectedWarehouseIds, warehouse.id]
    })
    setLastSelectedWarehouse(warehouse)
  }

  const handleAssign = () => {
    if (!(user && selectedUnassignedWarehouseIds.length > 0)) {
      return
    }
    for (const warehouseId of selectedUnassignedWarehouseIds) {
      onAssign({
        userId: user.id,
        warehouseId,
      })
    }
    setSelectedWarehouseIds([])
    setLastSelectedWarehouse(null)
  }

  const handleRemove = () => {
    if (!(user && selectedAssignedWarehouseIds.length > 0)) {
      return
    }
    for (const warehouseId of selectedAssignedWarehouseIds) {
      onRemove({
        userId: user.id,
        warehouseId,
      })
    }
    setSelectedWarehouseIds([])
    setLastSelectedWarehouse(null)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                className="size-4 text-primary"
                icon={Building06Icon}
              />
            </span>
            {translateMessage("generated.m0289")}
          </DialogTitle>
          <DialogDescription>
            {translateMessage("generated.m0290")}{" "}
            <strong>
              {normalizeValue(user?.full_name) || user?.email || ""}
            </strong>
            {translateMessage("generated.m0291")}
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="space-y-4 py-1">
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
              placeholder={translateMessage("generated.m0292")}
              type="text"
              value={search}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
            <Label
              className="cursor-pointer text-sm"
              htmlFor="show-assigned-warehouses-only"
            >
              {translateMessage("generated.m1066", {
                value0: assignedWarehouseIds.length,
              })}
            </Label>
            <Switch
              checked={showAssignedOnly}
              id="show-assigned-warehouses-only"
              onCheckedChange={(checked) => {
                setShowAssignedOnly(checked)
                setSelectedWarehouseIds([])
                setLastSelectedWarehouse(null)
              }}
            />
          </div>

          <WarehouseVirtualList
            assignedWarehouseIds={assignedWarehouseIds}
            fetchNextPage={fetchNextWarehouses}
            hasNextPage={hasNextVisibleWarehousesPage}
            isError={isListError}
            isFetchingNextPage={isFetchingVisibleWarehousesNextPage}
            isPending={isListPending}
            onWarehouseToggle={handleWarehouseToggle}
            selectedWarehouseIds={selectedWarehouseIds}
            warehouses={visibleWarehouses}
          />

          {selectedWarehouseIds.length > 0 ? (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5",
                selectedAssignedWarehouseIds.length > 0
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-primary/20 bg-primary/5"
              )}
            >
              <HugeiconsIcon
                className={cn(
                  "size-4 shrink-0",
                  selectedAssignedWarehouseIds.length > 0
                    ? "text-emerald-600"
                    : "text-primary"
                )}
                icon={WarehouseIcon}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {translateMessage("generated.m1067", {
                    value0: selectedWarehouseIds.length,
                  })}
                </p>
                <p className="text-muted-foreground text-xs">
                  {translateMessage("generated.m1068", {
                    value0: selectedUnassignedWarehouseIds.length,
                    value1: selectedAssignedWarehouseIds.length,
                  })}
                </p>
              </div>
              <Badge
                className="shrink-0"
                variant={
                  selectedAssignedWarehouseIds.length > 0
                    ? "secondary"
                    : "default"
                }
              >
                {lastSelectedWarehouse
                  ? `Ostatni: ${lastSelectedWarehouse.name}`
                  : "Wybrane"}
              </Badge>
            </div>
          ) : null}
        </div>

        <Separator />

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
          {canRemoveSelectedWarehouses ? (
            <Button
              className="w-full sm:w-auto"
              disabled={!canRemoveSelectedWarehouses}
              onClick={handleRemove}
              variant="destructive"
            >
              {translateMessage("generated.m1069", {
                value0: selectedAssignedWarehouseIds.length,
              })}
            </Button>
          ) : null}
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              {translateMessage("generated.m0885")}
            </Button>
            {canAssignSelectedWarehouses ? (
              <Button
                disabled={!canAssignSelectedWarehouses}
                onClick={handleAssign}
              >
                {translateMessage("generated.m1070", {
                  value0: selectedUnassignedWarehouseIds.length,
                })}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
