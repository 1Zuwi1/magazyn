"use client"

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { pluralize } from "../utils/helpers"
import { itemsColumns } from "./items-columns"
import type { ItemStats } from "./types"

interface ItemsTableProps {
  items: ItemStats[]
}

const globalFilterFn: FilterFn<ItemStats> = (row, _columnId, filterValue) => {
  const searchValue = filterValue?.toString().trim().toLowerCase()
  if (!searchValue) {
    return true
  }
  const definition = row.original?.definition
  if (!definition) {
    return false
  }
  return (
    definition.name.toLowerCase().includes(searchValue) ||
    definition.category.toLowerCase().includes(searchValue)
  )
}

export function ItemsTable({ items }: ItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data: items,
    columns: itemsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = items.length
  const isFiltered = globalFilter.length > 0
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <HugeiconsIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
          />
          <Input
            aria-label="Szukaj przedmiotów"
            className="h-10 pr-9 pl-9"
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Szukaj po nazwie lub kategorii..."
            value={globalFilter ?? ""}
          />
          {isFiltered && (
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
                  colSpan={itemsColumns.length}
                >
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon
                      className="size-8 text-muted-foreground/50"
                      icon={Search01Icon}
                    />
                    <p className="font-medium text-muted-foreground">
                      {isFiltered
                        ? "Brak wyników dla podanej frazy"
                        : "Brak przedmiotów"}
                    </p>
                    {isFiltered && (
                      <button
                        className="text-primary text-sm hover:underline"
                        onClick={() => setGlobalFilter("")}
                        type="button"
                      >
                        Wyczyść filtr
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
