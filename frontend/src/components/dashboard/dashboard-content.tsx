"use client"

import { Search } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { MOCK_WAREHOUSES } from "./mock-data"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState } from "./types"
import { filterWarehouses } from "./utils/filters"

export const DashboardContent = () => {
  const t = useTranslations("dashboard")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const filteredWarehouses = filterWarehouses(MOCK_WAREHOUSES, filters)

  return (
    <div className="flex-1 space-y-4">
      <div className="my-4 flex items-center space-x-2">
        <div className="relative max-w-sm flex-1">
          <HugeiconsIcon
            className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
            icon={Search}
          />
          <Input
            className="pl-8"
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder={t("search.placeholder")}
            value={filters.query}
          />
        </div>
        <WarehouseFilters filters={filters} onFilterChange={setFilters} />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-xl">{t("title")}</h3>
        <WarehouseGrid warehouses={filteredWarehouses} />
      </div>
    </div>
  )
}
