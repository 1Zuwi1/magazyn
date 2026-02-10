"use client"

import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { useDebouncedValue } from "@tanstack/react-pacer"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { formatDate, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import Link from "next/link"
import { type Dispatch, type SetStateAction, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ErrorEmptyState,
  FilterEmptyState,
  NoItemsEmptyState,
} from "@/components/ui/empty-state"
import {
  ClearFiltersButton,
  FilterBar,
  FilterGroup,
  FilterResults,
  FilterSelectWrapper,
  SearchInput,
} from "@/components/ui/filter-bar"
import PaginationFull from "@/components/ui/pagination-component"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAssortment from "@/hooks/use-assortment"
import { useMultipleItems } from "@/hooks/use-items"
import { useMultipleRacks } from "@/hooks/use-racks"
import type { InferApiOutput } from "@/lib/fetcher"
import type { AssortmentsSchema, RackAssortmentsSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { getDaysUntilExpiry } from "../utils/helpers"
import { CodeCell } from "./components/code-cell"
import { SortableHeader } from "./sortable-header"

export type ExpiryFilters = "DAYS_14" | "DAYS_7" | "DAYS_3" | "EXPIRED" | "ALL"

type RackAssortmentList = InferApiOutput<typeof RackAssortmentsSchema, "GET">
type AssortmentList = InferApiOutput<typeof AssortmentsSchema, "GET">
type SupportedAssortmentList = RackAssortmentList | AssortmentList
type RackAssortmentItem = RackAssortmentList["content"][number]
type AssortmentItemWithItemId = AssortmentList["content"][number]
type AssortmentItem = SupportedAssortmentList["content"][number]

const EXPIRY_FILTER_OPTIONS: {
  value: ExpiryFilters
  label: string
}[] = [
  { value: "ALL", label: "Wszystkie" },
  { value: "EXPIRED", label: "Przeterminowane" },
  { value: "DAYS_3", label: "Do 3 dni" },
  { value: "DAYS_7", label: "Do 7 dni" },
  { value: "DAYS_14", label: "Do 14 dni" },
]

const GS1_WITH_SERIAL_PATTERN = /^11\d{6}01(\d{14})21\d+$/
const GS1_AI_01_PATTERN = /\(01\)(\d{14})/
const EAN14_PATTERN = /^\d{14}$/
const DEFAULT_WAREHOUSE_PATH_SEGMENT = "magazyn"

const formatDateLabel = (value: string): string => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return "Brak danych"
  }
  return formatDate(parsedDate, "dd.MM.yyyy")
}

const getDaysToExpiry = (value: string): number | undefined => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined
  }
  return getDaysUntilExpiry(new Date(), parsedDate)
}

const extractEan14FromAssortmentCode = (value: string): string | null => {
  const normalizedCode = value.replace(/\s/g, "")
  const formattedMatch = GS1_AI_01_PATTERN.exec(normalizedCode)
  if (formattedMatch?.[1]) {
    return formattedMatch[1]
  }

  const rawMatch = GS1_WITH_SERIAL_PATTERN.exec(normalizedCode)
  if (rawMatch?.[1]) {
    return rawMatch[1]
  }

  if (EAN14_PATTERN.test(normalizedCode)) {
    return normalizedCode
  }

  return null
}

const buildItemsCatalogHref = (assortmentCode: string): string => {
  const ean14 = extractEan14FromAssortmentCode(assortmentCode)
  const params = new URLSearchParams({
    tab: "definitions",
    search: ean14 ?? assortmentCode,
  })

  return `/dashboard/items?${params.toString()}`
}

const buildRackWarehouseHref = ({
  rackId,
  warehouseId,
}: {
  rackId: number
  warehouseId: number
}): string => {
  const params = new URLSearchParams({
    rackId: rackId.toString(),
  })

  return `/dashboard/warehouse/id/${warehouseId}/${DEFAULT_WAREHOUSE_PATH_SEGMENT}?${params.toString()}`
}

function ExpiryStatusBadge({ value }: { value: string }) {
  const daysUntilExpiry = getDaysToExpiry(value)

  if (typeof daysUntilExpiry !== "number") {
    return <Badge variant="outline">Brak daty</Badge>
  }
  if (daysUntilExpiry < 0) {
    return <Badge variant="destructive">Przeterminowane</Badge>
  }
  const label = formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: pl,
  })
  if (daysUntilExpiry <= 3) {
    return <Badge variant="destructive">{label}</Badge>
  }
  if (daysUntilExpiry <= 7) {
    return (
      <Badge className="bg-yellow-500 text-white" variant="default">
        {label}
      </Badge>
    )
  }
  return <Badge variant="outline">{label}</Badge>
}

const hasEmbeddedItem = (item: AssortmentItem): item is RackAssortmentItem =>
  "item" in item

const hasItemId = (item: AssortmentItem): item is AssortmentItemWithItemId =>
  "itemId" in item

const getItemId = (item: AssortmentItem): number =>
  hasEmbeddedItem(item) ? item.item.id : item.itemId

const getItemName = (
  item: AssortmentItem,
  itemNamesById: Map<number, string>
): string => {
  const itemId = getItemId(item)
  if (hasEmbeddedItem(item)) {
    const embeddedName = item.item.name.trim()
    if (embeddedName) {
      return embeddedName
    }
  }

  return itemNamesById.get(itemId) ?? `Produkt #${itemId}`
}

interface AssortmentTableProps {
  isLoading?: boolean
}

interface AssortmentTableWithDataProps extends AssortmentTableProps {
  assortmentData: SupportedAssortmentList | null | undefined
  page: number
  setPage: Dispatch<SetStateAction<number>>
  expiryFilter: ExpiryFilters
  onExpiryFilterChange: (nextFilter: ExpiryFilters) => void
  search: string
  debouncedSearch: string
  onSearchChange: (value: string) => void
  sorting: SortingState
  onSortingChange: (nextSorting: SortingState) => void
}

interface AssortmentTableContentProps extends AssortmentTableProps {
  assortmentData: SupportedAssortmentList | null | undefined
  isError?: boolean
  onRetry?: () => void
  page: number
  setPage: (page: number) => void
  expiryFilter: ExpiryFilters
  onExpiryFilterChange: (nextFilter: ExpiryFilters) => void
  search: string
  debouncedSearch: string
  onSearchChange: (value: string) => void
  sorting: SortingState
  onSortingChange: (nextSorting: SortingState) => void
  manualServerControls?: boolean
}

const SKELETON_ROWS = 5

function AssortmentTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-full rounded-lg sm:max-w-sm" />
            <Skeleton className="h-10 w-full rounded-lg sm:w-44" />
          </div>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-20" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-28" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-14" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-16" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-24" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-28" />
            </TableHead>
            <TableHead className="h-11 px-4">
              <Skeleton className="h-3 w-12" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <TableRow
              className="transition-colors"
              key={index}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Category */}
              <TableCell className="px-4 py-3">
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              {/* Name */}
              <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              {/* Rack */}
              <TableCell className="px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              {/* QR Code */}
              <TableCell className="px-4 py-3">
                <Skeleton className="h-12 w-48 rounded" />
              </TableCell>
              {/* Added Date */}
              <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              {/* Expiry */}
              <TableCell className="px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </TableCell>
              {/* Actions */}
              <TableCell className="px-4 py-3">
                <Skeleton className="size-7 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const isExpiryFilterValue = (value: string | null): value is ExpiryFilters =>
  typeof value === "string" &&
  EXPIRY_FILTER_OPTIONS.some((option) => option.value === value)

function AssortmentTableContent({
  assortmentData,
  isLoading,
  isError,
  onRetry,
  page,
  setPage,
  expiryFilter,
  onExpiryFilterChange,
  search,
  debouncedSearch,
  onSearchChange,
  sorting,
  onSortingChange,
  manualServerControls = false,
}: AssortmentTableContentProps) {
  const assortmentItems = assortmentData?.content ?? []
  const itemIdsToFetch = useMemo(
    () => [
      ...new Set(assortmentItems.filter(hasItemId).map((item) => item.itemId)),
    ],
    [assortmentItems]
  )

  const rackIds = useMemo(
    () => [...new Set(assortmentItems.map((item) => item.rackId))],
    [assortmentItems]
  )

  const itemDetailsQueries = useMultipleItems({ itemIds: itemIdsToFetch })
  const rackDetailsQueries = useMultipleRacks({ rackIds })

  const itemNamesById = useMemo(() => {
    const namesMap = new Map<number, string>()

    for (const item of assortmentItems) {
      if (!hasEmbeddedItem(item)) {
        continue
      }

      const embeddedName = item.item.name.trim()
      if (embeddedName) {
        namesMap.set(item.item.id, embeddedName)
      }
    }

    for (const [index, itemId] of itemIdsToFetch.entries()) {
      const fetchedName = itemDetailsQueries[index]?.data?.name.trim()
      if (fetchedName && !namesMap.has(itemId)) {
        namesMap.set(itemId, fetchedName)
      }
    }

    return namesMap
  }, [assortmentItems, itemDetailsQueries, itemIdsToFetch])

  const rackNamesById = useMemo(() => {
    const namesMap = new Map<number, string>()
    for (const [index, rackId] of rackIds.entries()) {
      const rack = rackDetailsQueries[index]?.data
      const rackName = rack?.marker.trim()
      if (rackName) {
        namesMap.set(rackId, rackName)
      }
    }
    return namesMap
  }, [rackDetailsQueries, rackIds])

  const rackWarehouseIdsById = useMemo(() => {
    const warehouseIdsMap = new Map<number, number>()
    for (const [index, rackId] of rackIds.entries()) {
      const rack = rackDetailsQueries[index]?.data
      if (typeof rack?.warehouseId === "number") {
        warehouseIdsMap.set(rackId, rack.warehouseId)
      }
    }
    return warehouseIdsMap
  }, [rackDetailsQueries, rackIds])

  const assortmentColumns = useMemo<ColumnDef<AssortmentItem>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <SortableHeader column={column}>Kod</SortableHeader>
        ),
        cell: ({ row }) => <CodeCell value={row.original.code} />,
        enableSorting: true,
      },
      {
        id: "itemName",
        accessorFn: (row) => getItemName(row, itemNamesById),
        header: ({ column }) => (
          <SortableHeader column={column}>Produkt</SortableHeader>
        ),
        cell: ({ row }) => (
          <Link
            className="font-medium text-primary hover:underline"
            href={buildItemsCatalogHref(row.original.code)}
          >
            {getItemName(row.original, itemNamesById)}
          </Link>
        ),
        enableSorting: !manualServerControls,
      },
      {
        id: "rackName",
        accessorFn: (row) => rackNamesById.get(row.rackId) ?? "",
        header: ({ column }) => (
          <SortableHeader column={column}>Regał</SortableHeader>
        ),
        cell: ({ row }) => {
          const rackName =
            rackNamesById.get(row.original.rackId) ?? "Nieznany regał"
          const rackWarehouseId = rackWarehouseIdsById.get(row.original.rackId)

          if (rackWarehouseId === undefined) {
            return (
              <span className="font-medium text-muted-foreground">
                {rackName}
              </span>
            )
          }

          return (
            <Link
              className="font-medium text-primary hover:underline"
              href={buildRackWarehouseHref({
                rackId: row.original.rackId,
                warehouseId: rackWarehouseId,
              })}
            >
              {rackName}
            </Link>
          )
        },
        enableSorting: !manualServerControls,
      },
      {
        id: "position",
        accessorFn: (item) => `${item.positionX + 1}:${item.positionY + 1}`,
        header: ({ column }) => (
          <SortableHeader column={column}>Pozycja</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            Rząd {row.original.positionX + 1}, Kol. {row.original.positionY + 1}
          </span>
        ),
        enableSorting: !manualServerControls,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Dodano</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {formatDateLabel(row.original.createdAt)}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "expiresAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Ważność</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-mono text-sm">
              {formatDateLabel(row.original.expiresAt)}
            </div>
            <ExpiryStatusBadge value={row.original.expiresAt} />
          </div>
        ),
        enableSorting: true,
      },
    ],
    [itemNamesById, manualServerControls, rackNamesById, rackWarehouseIdsById]
  )

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater
    onSortingChange(nextSorting)
    if (manualServerControls) {
      setPage(1)
    }
  }

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    if (manualServerControls) {
      setPage(1)
    }
  }

  const table = useReactTable({
    data: assortmentItems,
    columns: assortmentColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(manualServerControls
      ? {}
      : {
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
        }),
    manualSorting: manualServerControls,
    manualFiltering: manualServerControls,
    onSortingChange: handleSortingChange,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = filterValue?.toString().trim().toLowerCase()
      if (!searchValue) {
        return true
      }
      const itemName = getItemName(row.original, itemNamesById).toLowerCase()
      const rackName =
        rackNamesById.get(row.original.rackId)?.toLowerCase() ?? ""

      return (
        row.original.code.toLowerCase().includes(searchValue) ||
        itemName.includes(searchValue) ||
        rackName.includes(searchValue) ||
        row.original.userId.toString().includes(searchValue)
      )
    },
    state: {
      sorting,
      globalFilter: search,
    },
  })

  const filteredCount = manualServerControls
    ? assortmentItems.length
    : table.getFilteredRowModel().rows.length
  const totalCount = assortmentData?.totalElements ?? assortmentItems.length
  const isSearchFiltered = debouncedSearch.length > 0 || search.length > 0
  const isExpiryFiltered = expiryFilter !== "ALL"
  const isFiltered = isSearchFiltered || isExpiryFiltered
  const totalPages = assortmentData?.totalPages ?? 1

  const clearAllFilters = () => {
    handleSearchChange("")
    onExpiryFilterChange("ALL")
    setPage(1)
  }

  const itemLabel = {
    singular: "przedmiot",
    plural: "przedmioty",
    genitive: "przedmiotów",
  }

  if (isLoading) {
    return <AssortmentTableSkeleton />
  }

  if (isError) {
    return <ErrorEmptyState onRetry={onRetry} />
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <FilterBar className="gap-3">
          <FilterGroup>
            <SearchInput
              aria-label="Filtruj asortyment po kodzie i identyfikatorach"
              onChange={handleSearchChange}
              placeholder="Szukaj po kodzie kreskowym, nazwie produktu lub regału..."
              value={search}
            />

            <FilterSelectWrapper
              icon={Calendar03Icon}
              isActive={isExpiryFiltered}
            >
              <Select
                onValueChange={(value) => {
                  if (isExpiryFilterValue(value)) {
                    onExpiryFilterChange(value)
                    setPage(1)
                  }
                }}
                value={expiryFilter}
              >
                <SelectTrigger
                  aria-label="Filtruj według daty ważności"
                  className={cn(
                    "h-10! w-44 gap-2 pl-9",
                    isExpiryFiltered &&
                      "border-primary/50 bg-primary/5 text-primary"
                  )}
                >
                  <SelectValue
                    render={
                      <span className="truncate">
                        {
                          EXPIRY_FILTER_OPTIONS.find(
                            (option) => option.value === expiryFilter
                          )?.label
                        }
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span
                        className={cn(
                          option.value === "EXPIRED" && "text-destructive",
                          option.value === "DAYS_3" && "text-orange-500"
                        )}
                      >
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSelectWrapper>

            {isFiltered && <ClearFiltersButton onClick={clearAllFilters} />}
          </FilterGroup>

          <FilterResults
            filteredCount={filteredCount}
            isFiltered={isFiltered}
            itemLabel={itemLabel}
            totalCount={totalCount}
          />
        </FilterBar>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              className="border-b bg-muted/30 hover:bg-muted/30"
              key={headerGroup.id}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="h-11 px-4 font-semibold text-xs uppercase tracking-wider"
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                className="transition-colors hover:bg-muted/50"
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="px-4 py-3" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="p-0" colSpan={assortmentColumns.length}>
                {isFiltered ? (
                  <FilterEmptyState onClear={clearAllFilters} />
                ) : (
                  <NoItemsEmptyState itemName="przedmiot" />
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationFull
        currentPage={page}
        setPage={setPage}
        totalPages={totalPages}
        variant="compact"
      />
    </div>
  )
}

export function AssortmentTable({ isLoading }: AssortmentTableProps) {
  const [page, setPage] = useState(1)
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilters>("ALL")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const sortParams = useMemo(() => {
    if (sorting.length === 0) {
      return {}
    }
    return {
      sortBy: sorting[0].id,
      sortDir: sorting[0].desc ? ("desc" as const) : ("asc" as const),
    }
  }, [sorting])
  const [debouncedSearch] = useDebouncedValue(search, {
    wait: 500,
  })
  const {
    data: assortmentData,
    isPending,
    isError,
    refetch,
  } = useAssortment({
    page: page - 1,
    size: 10,
    search: debouncedSearch.trim() || undefined,
    expiryFilters: expiryFilter === "ALL" ? undefined : [expiryFilter],
    ...sortParams,
  })

  return (
    <AssortmentTableContent
      assortmentData={assortmentData}
      debouncedSearch={debouncedSearch}
      expiryFilter={expiryFilter}
      isError={isError}
      isLoading={isLoading || isPending}
      onExpiryFilterChange={setExpiryFilter}
      onRetry={() => refetch()}
      onSearchChange={setSearch}
      onSortingChange={setSorting}
      page={page}
      search={search}
      setPage={setPage}
      sorting={sorting}
    />
  )
}

export function AssortmentTableWithData({
  assortmentData,
  isLoading,
  page,
  setPage,
  expiryFilter,
  onExpiryFilterChange,
  search,
  debouncedSearch,
  onSearchChange,
  sorting,
  onSortingChange,
}: AssortmentTableWithDataProps) {
  return (
    <AssortmentTableContent
      assortmentData={assortmentData}
      debouncedSearch={debouncedSearch}
      expiryFilter={expiryFilter}
      isLoading={isLoading}
      manualServerControls
      onExpiryFilterChange={onExpiryFilterChange}
      onSearchChange={onSearchChange}
      onSortingChange={onSortingChange}
      page={page}
      search={search}
      setPage={setPage}
      sorting={sorting}
    />
  )
}
