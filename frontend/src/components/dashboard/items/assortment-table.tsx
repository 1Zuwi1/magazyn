"use client"

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { AssortmentsSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { getDaysUntilExpiry } from "../utils/helpers"
import { CodeCell } from "./components/code-cell"
import { SortableHeader } from "./sortable-header"

type ExpiryFilters = "DAYS_14" | "DAYS_7" | "DAYS_3" | "EXPIRED" | "ALL"

type AssortmentList = InferApiOutput<typeof AssortmentsSchema, "GET">
type AssortmentItem = AssortmentList["content"][number]

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

const dateFormatter = new Intl.DateTimeFormat("pl-PL")
const GS1_WITH_SERIAL_PATTERN = /^11\d{6}01(\d{14})21\d+$/
const GS1_AI_01_PATTERN = /\(01\)(\d{14})/
const EAN14_PATTERN = /^\d{14}$/
const DEFAULT_WAREHOUSE_PATH_SEGMENT = "magazyn"

const formatDateLabel = (value: string): string => {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return "Brak danych"
  }
  return dateFormatter.format(parsedDate)
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
  if (daysUntilExpiry <= 3) {
    return <Badge variant="destructive">za {daysUntilExpiry} dni</Badge>
  }
  if (daysUntilExpiry <= 7) {
    return (
      <Badge className="bg-yellow-500 text-white" variant="default">
        za {daysUntilExpiry} dni
      </Badge>
    )
  }
  return <Badge variant="outline">za {daysUntilExpiry} dni</Badge>
}

function matchesExpiryFilter(
  item: AssortmentItem,
  filterValue: ExpiryFilters
): boolean {
  if (filterValue === "ALL") {
    return true
  }

  const daysUntilExpiry = getDaysToExpiry(item.expiresAt)
  if (typeof daysUntilExpiry !== "number") {
    return false
  }

  switch (filterValue) {
    case "EXPIRED":
      return daysUntilExpiry < 0
    case "DAYS_3":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 3
    case "DAYS_7":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
    case "DAYS_14":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 14
    default:
      return true
  }
}

interface AssortmentTableProps {
  isLoading?: boolean
}

interface AssortmentTableWithDataProps extends AssortmentTableProps {
  assortmentData: AssortmentList | null | undefined
}

interface AssortmentTableContentProps extends AssortmentTableProps {
  assortmentData: AssortmentList | null | undefined
  isError?: boolean
  onRetry?: () => void
}

const SKELETON_ROWS = 5

function AssortmentTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter Bar Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
}: AssortmentTableContentProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilters>("ALL")
  const assortmentItems = assortmentData?.content ?? []
  const rackIds = useMemo(
    () => [...new Set(assortmentItems.map((item) => item.rackId))],
    [assortmentItems]
  )

  const rackDetailsQueries = useMultipleRacks({ rackIds })
  const itemIds = useMemo(
    () => [...new Set(assortmentItems.map((item) => item.itemId))],
    [assortmentItems]
  )
  const itemDetailsQueries = useMultipleItems({ itemIds })

  const itemNamesById = useMemo(() => {
    const namesMap = new Map<number, string>()
    for (const [index, itemId] of itemIds.entries()) {
      const item = itemDetailsQueries[index]?.data
      const itemName = item?.name.trim()
      if (itemName) {
        namesMap.set(itemId, itemName)
      }
    }
    return namesMap
  }, [itemDetailsQueries, itemIds])

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

  const filteredItems = useMemo(
    () =>
      assortmentItems.filter((item) => matchesExpiryFilter(item, expiryFilter)),
    [assortmentItems, expiryFilter]
  )
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
        accessorFn: (row) => itemNamesById.get(row.itemId) ?? "",
        header: ({ column }) => (
          <SortableHeader column={column}>Produkt</SortableHeader>
        ),
        cell: ({ row }) => (
          <Link
            className="font-medium text-primary hover:underline"
            href={buildItemsCatalogHref(row.original.code)}
          >
            {itemNamesById.get(row.original.itemId) ?? "Nieznany produkt"}
          </Link>
        ),
        enableSorting: true,
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
        enableSorting: true,
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
        enableSorting: true,
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
    [itemNamesById, rackNamesById, rackWarehouseIdsById]
  )

  const table = useReactTable({
    data: filteredItems,
    columns: assortmentColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = filterValue?.toString().trim().toLowerCase()
      if (!searchValue) {
        return true
      }
      const itemName =
        itemNamesById.get(row.original.itemId)?.toLowerCase() ?? ""
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
      columnFilters,
      globalFilter,
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = assortmentData?.totalElements ?? assortmentItems.length
  const isSearchFiltered = globalFilter.length > 0
  const isExpiryFiltered = expiryFilter !== "ALL"
  const isFiltered = isSearchFiltered || isExpiryFiltered
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  const clearAllFilters = () => {
    setGlobalFilter("")
    setExpiryFilter("ALL")
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
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar>
        <FilterGroup>
          <SearchInput
            aria-label="Filtruj asortyment po kodzie i identyfikatorach"
            onChange={setGlobalFilter}
            placeholder="Szukaj po kodzie kreskowym, nazwie produktu lub regału..."
            value={globalFilter}
          />

          {/* Expiry Filter */}
          <FilterSelectWrapper
            icon={Calendar03Icon}
            isActive={isExpiryFiltered}
          >
            <Select
              onValueChange={(value) => {
                if (isExpiryFilterValue(value)) {
                  setExpiryFilter(value)
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

          {/* Clear all filters */}
          {isFiltered && <ClearFiltersButton onClick={clearAllFilters} />}
        </FilterGroup>

        <FilterResults
          filteredCount={filteredCount}
          isFiltered={isFiltered}
          itemLabel={itemLabel}
          totalCount={totalCount}
        />
      </FilterBar>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Strona{" "}
            <span className="font-mono font-semibold text-foreground">
              {currentPage}
            </span>{" "}
            z{" "}
            <span className="font-mono font-semibold text-foreground">
              {totalPages}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <Button
              className="gap-1.5"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon className="size-3.5" icon={ArrowLeft02Icon} />
              <span className="hidden sm:inline">Poprzednia</span>
            </Button>
            <Button
              className="gap-1.5"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="sm"
              variant="outline"
            >
              <span className="hidden sm:inline">Następna</span>
              <HugeiconsIcon className="size-3.5" icon={ArrowRight02Icon} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AssortmentTable({ isLoading }: AssortmentTableProps) {
  const { data: assortmentData, isPending, isError, refetch } = useAssortment()

  return (
    <AssortmentTableContent
      assortmentData={assortmentData}
      isError={isError}
      isLoading={isLoading || isPending}
      onRetry={() => refetch()}
    />
  )
}

export function AssortmentTableWithData({
  assortmentData,
  isLoading,
}: AssortmentTableWithDataProps) {
  return (
    <AssortmentTableContent
      assortmentData={assortmentData}
      isLoading={isLoading}
    />
  )
}
