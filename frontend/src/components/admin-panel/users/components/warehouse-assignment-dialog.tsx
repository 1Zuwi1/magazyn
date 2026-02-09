"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useState } from "react"
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
  } = useInfiniteWarehouses({
    nameFilter: debouncedSearch,
  })

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
          <DialogTitle>Przypisz magazyn</DialogTitle>
          <DialogDescription>
            Przypisz magazyn do użytkownika{" "}
            <strong>
              {normalizeValue(user?.full_name) || user?.email || ""}
            </strong>
            , aby otrzymywał alerty z tego magazynu.
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="space-y-3 py-1">
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
            <p className="text-muted-foreground text-sm">
              Wybrany magazyn:{" "}
              <strong className="text-foreground">
                {selectedWarehouse.name}
              </strong>
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-1">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            Anuluj
          </Button>
          {selectedWarehouse ? (
            <Button onClick={handleRemove} variant="destructive">
              Usuń przypisanie
            </Button>
          ) : null}
          <Button disabled={!selectedWarehouse} onClick={handleAssign}>
            Przypisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
