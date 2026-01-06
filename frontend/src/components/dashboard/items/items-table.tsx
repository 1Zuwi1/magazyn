"use client"

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          aria-label="Szukaj przedmiotów"
          className="max-w-sm"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Szukaj po nazwie lub kategorii..."
          value={globalFilter ?? ""}
        />
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
                  colSpan={itemsColumns.length}
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
