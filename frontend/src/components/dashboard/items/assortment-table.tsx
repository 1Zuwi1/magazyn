"use client"

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
import { pluralize } from "../utils/helpers"
import { assortmentColumns } from "./assortment-columns"
import type { ItemInstance } from "./types"

type expiryFilters = "14_DAYS" | "7_DAYS" | "3_DAYS" | "EXPIRED" | "ALL"

const EXPIRY_FILTER_OPTIONS: { value: expiryFilters; label: string }[] = [
  { value: "ALL", label: "Wszystkie" },
  { value: "EXPIRED", label: "Przeterminowane" },
  { value: "3_DAYS", label: "3 dni" },
  { value: "7_DAYS", label: "7 dni" },
  { value: "14_DAYS", label: "14 dni" },
]

function getDaysUntilExpiry(today: Date, expiryDate: Date): number {
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function matchesExpiryFilter(
  item: ItemInstance,
  filterValue: expiryFilters
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
  const [expiryFilter, setExpiryFilter] = useState<expiryFilters>("ALL")

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          aria-label="Filtruj przedmioty po nazwie lub kategorii"
          className="max-w-sm"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Szukaj po nazwie lub kategorii..."
          value={globalFilter ?? ""}
        />

        <Select
          onValueChange={(value) => setExpiryFilter(value as expiryFilters)}
          value={expiryFilter}
        >
          <SelectTrigger
            aria-label="Filtruj według daty ważności"
            className="w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length}{" "}
          {pluralize(
            table.getFilteredRowModel().rows.length,
            "przedmiot",
            "przedmioty",
            "przedmiotów"
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                  colSpan={assortmentColumns.length}
                >
                  Brak wyników.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="sm"
          variant="outline"
        >
          Poprzednia
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          Następna
        </Button>
      </div>
    </div>
  )
}
