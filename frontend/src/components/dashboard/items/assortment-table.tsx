"use client"

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
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
import { cn } from "@/lib/utils"
import { getDaysUntilExpiry } from "../utils/helpers"
import { assortmentColumns } from "./assortment-columns"
import type { ItemInstance } from "./types"

type ExpiryFilters = "14_DAYS" | "7_DAYS" | "3_DAYS" | "EXPIRED" | "ALL"

const EXPIRY_FILTER_OPTIONS: {
  value: ExpiryFilters
  label: string
  icon?: boolean
}[] = [
  { value: "ALL", label: "Wszystkie" },
  { value: "EXPIRED", label: "Przeterminowane", icon: true },
  { value: "3_DAYS", label: "Do 3 dni", icon: true },
  { value: "7_DAYS", label: "Do 7 dni", icon: true },
  { value: "14_DAYS", label: "Do 14 dni", icon: true },
]

function matchesExpiryFilter(
  item: ItemInstance,
  filterValue: ExpiryFilters
): boolean {
  if (filterValue === "ALL") {
    return true
  }

  const daysUntilExpiry = getDaysUntilExpiry(new Date(), item.expiryDate)

  switch (filterValue) {
    case "EXPIRED":
      return daysUntilExpiry < 0
    case "3_DAYS":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 3
    case "7_DAYS":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
    case "14_DAYS":
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 14
    default:
      return true
  }
}

interface AssortmentTableProps {
  items: ItemInstance[]
  isLoading?: boolean
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

export function AssortmentTable({ items, isLoading }: AssortmentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilters>("ALL")

  const filteredItems = useMemo(
    () => items.filter((item) => matchesExpiryFilter(item, expiryFilter)),
    [items, expiryFilter]
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
      const searchValue = filterValue?.toString().trim()
      if (!searchValue) {
        return true
      }
      const definition = row.original?.definition
      if (!definition) {
        return false
      }
      const normalizedSearchValue = searchValue.toLowerCase()
      const name = definition.name.toLowerCase()
      const category = definition.category.toLowerCase()
      return (
        name.includes(normalizedSearchValue) ||
        category.includes(normalizedSearchValue)
      )
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = items.length
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

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar>
        <FilterGroup>
          <SearchInput
            aria-label="Filtruj przedmioty po nazwie lub kategorii"
            onChange={setGlobalFilter}
            placeholder="Szukaj po nazwie lub kategorii..."
            value={globalFilter}
          />

          {/* Expiry Filter */}
          <FilterSelectWrapper
            icon={Calendar03Icon}
            isActive={isExpiryFiltered}
          >
            <Select
              onValueChange={(value) => setExpiryFilter(value as ExpiryFilters)}
              value={expiryFilter}
            >
              <SelectTrigger
                aria-label="Filtruj według daty ważności"
                className={cn(
                  "h-10 w-44 gap-2 pl-9",
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
                        option.value === "3_DAYS" && "text-orange-500"
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
