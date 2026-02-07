"use client"

import { Alert02Icon, Search } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useWarehouses from "@/hooks/use-warehouses"
import type { Warehouse } from "@/lib/schemas"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState } from "./types"
import { filterWarehouses } from "./utils/filters"
import { pluralize } from "./utils/helpers"

const EMPTY_ARRAY: Warehouse[] = []

export const WarehouseContent = () => {
  const { data: warehouses, isPending, isError, refetch } = useWarehouses()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const filteredWarehouses = filterWarehouses(
    warehouses?.content ?? EMPTY_ARRAY,
    filters
  )

  const hasActiveFilters =
    filters.query !== "" ||
    filters.minOccupancy !== DEFAULT_FILTERS.minOccupancy ||
    filters.tempRange[0] !== DEFAULT_FILTERS.tempRange[0] ||
    filters.tempRange[1] !== DEFAULT_FILTERS.tempRange[1] ||
    filters.showEmpty !== DEFAULT_FILTERS.showEmpty

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-card py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
          <HugeiconsIcon
            className="size-6 text-destructive"
            icon={Alert02Icon}
          />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Nie udało się załadować magazynów</p>
          <p className="text-muted-foreground text-sm">
            Wystąpił problem podczas pobierania danych. Spróbuj ponownie.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1 sm:min-w-72">
            <HugeiconsIcon
              className="absolute top-2.5 left-3 size-4 text-muted-foreground"
              icon={Search}
            />
            <Input
              className="pl-9"
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, query: e.target.value }))
              }}
              placeholder="Szukaj magazynu, regału lub ID..."
              value={filters.query}
            />
          </div>
          <WarehouseFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {hasActiveFilters && (
            <Badge className="font-normal" variant="secondary">
              Filtrowane
            </Badge>
          )}
          <span>
            {filteredWarehouses.length}{" "}
            {pluralize(
              filteredWarehouses.length,
              "magazyn",
              "magazyny",
              "magazynów"
            )}
          </span>
        </div>
      </div>

      {/* Warehouse Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Twoje Magazyny</h2>
        </div>
        <WarehouseGrid isLoading={isPending} warehouses={filteredWarehouses} />
      </section>
    </div>
  )
}
