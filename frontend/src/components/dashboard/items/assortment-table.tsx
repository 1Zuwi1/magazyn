"use client"

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Calendar03Icon,
  Cancel01Icon,
  FilterIcon,
  Search01Icon,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getDaysUntilExpiry, pluralize } from "../utils/helpers"
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
}

export function AssortmentTable({ items }: AssortmentTableProps) {
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

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative max-w-sm flex-1 sm:min-w-[280px]">
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
            />
            <Input
              aria-label="Filtruj przedmioty po nazwie lub kategorii"
              className="h-10 pr-9 pl-9"
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Szukaj po nazwie lub kategorii..."
              value={globalFilter ?? ""}
            />
            {isSearchFiltered && (
              <button
                aria-label="Wyczyść wyszukiwanie"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setGlobalFilter("")}
                type="button"
              >
                <HugeiconsIcon className="size-3.5" icon={Cancel01Icon} />
              </button>
            )}
          </div>

          {/* Expiry Filter */}
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) => setExpiryFilter(value as ExpiryFilters)}
              value={expiryFilter}
            >
              <SelectTrigger
                aria-label="Filtruj według daty ważności"
                className={cn(
                  "h-10 w-44 gap-2",
                  isExpiryFiltered &&
                    "border-primary/50 bg-primary/5 text-primary"
                )}
              >
                <HugeiconsIcon
                  className="size-4 shrink-0"
                  icon={Calendar03Icon}
                />
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

            {/* Clear all filters */}
            {isFiltered && (
              <Button
                className="gap-1.5 text-muted-foreground"
                onClick={clearAllFilters}
                size="sm"
                variant="ghost"
              >
                <HugeiconsIcon className="size-3.5" icon={FilterIcon} />
                <span>Wyczyść</span>
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-sm">
          {isFiltered ? (
            <span className="rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {filteredCount} z {totalCount}{" "}
              {pluralize(totalCount, "produktu", "produktów", "produktów")}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {totalCount}{" "}
              {pluralize(totalCount, "przedmiot", "przedmioty", "przedmiotów")}
            </span>
          )}
        </div>
      </div>

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
                <TableCell
                  className="h-32 text-center"
                  colSpan={assortmentColumns.length}
                >
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon
                      className="size-8 text-muted-foreground/50"
                      icon={Search01Icon}
                    />
                    <p className="font-medium text-muted-foreground">
                      {isFiltered
                        ? "Brak wyników dla wybranych filtrów"
                        : "Brak przedmiotów"}
                    </p>
                    {isFiltered && (
                      <button
                        className="text-primary text-sm hover:underline"
                        onClick={clearAllFilters}
                        type="button"
                      >
                        Wyczyść wszystkie filtry
                      </button>
                    )}
                  </div>
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
