"use client"

import {
  Building06Icon,
  Search01Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useState } from "react"
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
import { Separator } from "@/components/ui/separator"
import type { AdminUser } from "@/hooks/use-admin-users"
import { useInfiniteWarehouses } from "@/hooks/use-warehouses"
import type { Warehouse } from "@/lib/schemas"
import { normalizeValue } from "../lib/user-utils"
import { WarehouseVirtualList } from "./warehouse-virtual-list"

interface WarehouseAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | undefined
  onAssign: (params: { userId: number; warehouseId: number }) => void
  onRemove: (params: { userId: number; warehouseId: number }) => void
}

export function WarehouseAssignmentDialog({
  open,
  onOpenChange,
  user,
  onAssign,
  onRemove,
}: WarehouseAssignmentDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null
  )

  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  })

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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearch("")
      setSelectedWarehouse(null)
    }
    onOpenChange(isOpen)
  }

  const handleAssign = () => {
    if (!(user && selectedWarehouse)) {
      return
    }
    onAssign({
      userId: user.id,
      warehouseId: selectedWarehouse.id,
    })
    handleOpenChange(false)
  }

  const handleRemove = () => {
    if (!(user && selectedWarehouse)) {
      return
    }
    onRemove({
      userId: user.id,
      warehouseId: selectedWarehouse.id,
    })
    handleOpenChange(false)
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
            Przypisz magazyn
          </DialogTitle>
          <DialogDescription>
            Przypisz magazyn do użytkownika{" "}
            <strong>
              {normalizeValue(user?.full_name) || user?.email || ""}
            </strong>
            , aby otrzymywał alerty z tego magazynu.
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
                setSelectedWarehouse(null)
              }}
              placeholder="Szukaj magazynu..."
              type="text"
              value={search}
            />
          </div>

          <WarehouseVirtualList
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            isPending={isLoading}
            onWarehouseSelect={setSelectedWarehouse}
            selectedWarehouse={selectedWarehouse}
            warehouses={warehouses}
          />

          {selectedWarehouse ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <HugeiconsIcon
                className="size-4 shrink-0 text-primary"
                icon={WarehouseIcon}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {selectedWarehouse.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedWarehouse.racksCount} regałów &middot;{" "}
                  {selectedWarehouse.occupancy}% zajętości
                </p>
              </div>
              <Badge className="shrink-0" variant="default">
                Wybrany
              </Badge>
            </div>
          ) : null}
        </div>

        <Separator />

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
          {selectedWarehouse ? (
            <Button
              className="w-full sm:w-auto"
              onClick={handleRemove}
              variant="destructive"
            >
              Usuń przypisanie
            </Button>
          ) : null}
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={() => handleOpenChange(false)} variant="outline">
              Anuluj
            </Button>
            <Button disabled={!selectedWarehouse} onClick={handleAssign}>
              Przypisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
