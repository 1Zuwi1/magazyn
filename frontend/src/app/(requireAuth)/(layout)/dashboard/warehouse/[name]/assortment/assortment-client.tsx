"use client"

import { PackageIcon } from "@hugeicons/core-free-icons"
import { useDebouncedValue } from "@tanstack/react-pacer"
import type { SortingState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import {
  AssortmentTableWithData,
  type ExpiryFilters,
} from "@/components/dashboard/items/assortment-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import useAssortments from "@/hooks/use-assortment"
import { useCurrentWarehouseId } from "@/hooks/use-current-warehouse-id"
import useWarehouses from "@/hooks/use-warehouses"

export default function AssortmentClient() {
  const { warehouseIdForQuery, isHydrated, isMissingWarehouseId } =
    useCurrentWarehouseId({
      redirectIfMissingTo: "/dashboard/warehouse",
    })

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilters>("ALL")
  const [sorting, setSorting] = useState<SortingState>([])
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  })
  const searchQuery = debouncedSearch.trim()

  const sortingParams = useMemo(() => {
    const primarySorting = sorting[0]
    if (!primarySorting) {
      return {
        sortBy: undefined,
        sortDir: undefined,
      }
    }

    const sortBy = primarySorting.id

    const sortDir: "asc" | "desc" = primarySorting.desc ? "desc" : "asc"

    return {
      sortBy,
      sortDir: sortBy ? sortDir : undefined,
    }
  }, [sorting])

  const {
    data: warehouse,
    isPending: isWarehousePending,
    isError: isWarehouseError,
    refetch: refetchWarehouse,
  } = useWarehouses({
    warehouseId: warehouseIdForQuery,
  })

  const {
    data: assortments,
    isPending: isAssortmentsPending,
    isError: isAssortmentsError,
    refetch: refetchAssortments,
  } = useAssortments({
    warehouseId: warehouse?.id ?? -1,
    page: page - 1,
    size: 10,
    search: searchQuery || undefined,
    expiryFilters: expiryFilter === "ALL" ? undefined : [expiryFilter],
    sortBy: sortingParams.sortBy,
    sortDir: sortingParams.sortDir,
  })

  const isError = isWarehouseError || isAssortmentsError
  const isLoading = !isHydrated || isWarehousePending || isAssortmentsPending

  const headerStats = [
    {
      label: "Produktów",
      value: assortments?.totalElements ?? 0,
      icon: PackageIcon,
    },
  ]

  if (isMissingWarehouseId) {
    return null
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <PageHeader
          backHref="/dashboard/warehouse"
          backTitle="Powrót do magazynu"
          description="Przeglądaj wszystkie produkty przechowywane w tym magazynie."
          title="Asortyment"
        />
        <ErrorEmptyState
          onRetry={() => {
            refetchWarehouse()
            refetchAssortments()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        backHref={`/dashboard/warehouse/${encodeURIComponent(warehouse?.name ?? "")}`}
        backTitle="Powrót do magazynu"
        description="Przeglądaj wszystkie produkty przechowywane w tym magazynie."
        stats={headerStats}
        title="Asortyment"
        titleBadge={warehouse?.name}
      />

      <AssortmentTableWithData
        assortmentData={assortments}
        debouncedSearch={searchQuery}
        expiryFilter={expiryFilter}
        isLoading={isLoading}
        onExpiryFilterChange={setExpiryFilter}
        onSearchChange={setSearch}
        onSortingChange={setSorting}
        page={page}
        search={search}
        setPage={setPage}
        sorting={sorting}
      />
    </div>
  )
}
