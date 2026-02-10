"use client"

import {
  Building05Icon,
  ChartLineData01Icon,
  PackageIcon,
  Search,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useLocale } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import useWarehouses from "@/hooks/use-warehouses"
import { translateMessage } from "@/i18n/translate-message"
import { normalizeTranscript } from "@/lib/voice/commands"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import { ErrorEmptyState } from "../ui/empty-state"
import { PageHeader } from "./page-header"
import { DEFAULT_FILTERS, WarehouseFilters } from "./storage-filters"
import { WarehouseGrid } from "./storage-grid"
import type { FilterState } from "./types"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

function getOccupancyVariant(
  occupancy: number
): "default" | "warning" | "destructive" {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "default"
}

const isWarehouseMatch = ({
  inputName,
  warehouseId,
  warehouseName,
}: {
  inputName: string
  warehouseId: number
  warehouseName: string
}): boolean => {
  const normalizedInput = normalizeTranscript(inputName, { toLowerCase: true })
  const normalizedName = normalizeTranscript(warehouseName, {
    toLowerCase: true,
  })
  const normalizedId = normalizeTranscript(String(warehouseId), {
    toLowerCase: true,
  })

  return normalizedName === normalizedInput || normalizedId === normalizedInput
}

export const WarehouseContent = () => {
  const locale = useLocale()
  const pendingAction = useVoiceCommandStore((state) => state.pendingAction)
  const clearPendingAction = useVoiceCommandStore(
    (state) => state.clearPendingAction
  )
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [pendingVoiceWarehouseName, setPendingVoiceWarehouseName] = useState<
    string | null
  >(null)
  const [debouncedFilters] = useDebouncedValue(filters, { wait: 500 })
  const {
    data: warehouses,
    isPending,
    isError,
    refetch,
  } = useWarehouses({
    nameFilter: debouncedFilters.query || undefined,
    minPercentOfOccupiedSlots: debouncedFilters.minOccupancy || undefined,
    onlyNonEmpty: !debouncedFilters.showEmpty,
  })

  useEffect(() => {
    if (!pendingAction) {
      return
    }

    const { warehouseName, itemName } = pendingAction.payload
    const normalizedWarehouseName = warehouseName?.trim()
    const normalizedItemName = itemName?.trim()
    const query = normalizedWarehouseName || normalizedItemName || ""

    if (query) {
      setFilters((prev) => ({ ...prev, query }))
      toast.success(translateMessage("generated.m0658", { value0: query }))
    } else {
      toast.success(translateMessage("generated.m0659"))
    }

    setPendingVoiceWarehouseName(normalizedWarehouseName ?? null)
    clearPendingAction()
  }, [pendingAction, clearPendingAction])

  useEffect(() => {
    if (!pendingVoiceWarehouseName || isPending) {
      return
    }

    if (isError) {
      toast.error(translateMessage("generated.m0660"))
      setPendingVoiceWarehouseName(null)
      return
    }

    const hasMatchingWarehouse = (warehouses?.content ?? []).some((warehouse) =>
      isWarehouseMatch({
        inputName: pendingVoiceWarehouseName,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
      })
    )

    if (!hasMatchingWarehouse) {
      toast.error(
        translateMessage("generated.m0661", {
          value0: pendingVoiceWarehouseName.trim(),
        })
      )
    }

    setPendingVoiceWarehouseName(null)
  }, [pendingVoiceWarehouseName, isPending, isError, warehouses])

  const hasActiveFilters =
    filters.query !== "" ||
    filters.minOccupancy !== DEFAULT_FILTERS.minOccupancy ||
    filters.showEmpty !== DEFAULT_FILTERS.showEmpty

  const totalWarehouses = warehouses?.totalElements ?? 0
  const totalCapacity = warehouses?.summary.totalCapacity ?? 0
  const totalUsed = warehouses?.summary.occupiedSlots ?? 0
  const overallOccupancy =
    totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0
  const headerStats = [
    {
      label: translateMessage("generated.m0886"),
      value: totalWarehouses,
      icon: PackageIcon,
    },
    {
      label: translateMessage("generated.m0094"),
      value: `${overallOccupancy}%`,
      icon: ChartLineData01Icon,
      variant: getOccupancyVariant(overallOccupancy),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        description={translateMessage("generated.m0101")}
        icon={Building05Icon}
        iconBadge={totalWarehouses}
        stats={headerStats}
        statsChildren={
          <div className="flex flex-col items-center rounded-lg border bg-background/50 px-4 py-2 backdrop-blur-sm">
            <span className="font-bold font-mono text-foreground text-lg">
              {totalUsed.toLocaleString(locale)}
            </span>
            <span className="text-muted-foreground text-xs">
              / {totalCapacity.toLocaleString(locale)}
            </span>
          </div>
        }
        title={translateMessage("generated.m0886")}
      />
      {isError ? (
        <ErrorEmptyState onRetry={refetch} />
      ) : (
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
                  placeholder={translateMessage("generated.m0292")}
                  value={filters.query}
                />
              </div>
              <WarehouseFilters filters={filters} onFilterChange={setFilters} />
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {hasActiveFilters && (
                <Badge className="font-normal" variant="secondary">
                  {translateMessage("generated.m1008")}
                </Badge>
              )}
              <span>
                {translateMessage("generated.m1106", {
                  value0: warehouses?.totalElements ?? 0,
                })}
              </span>
            </div>
          </div>

          {/* Warehouse Grid */}
          <section className="@container space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {translateMessage("generated.m0664")}
              </h2>
            </div>
            <WarehouseGrid
              isLoading={isPending}
              warehouses={warehouses?.content ?? []}
            />
          </section>
        </div>
      )}
    </div>
  )
}
