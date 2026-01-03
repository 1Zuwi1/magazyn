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
import { assortmentColumns } from "./assortment-columns"
import type { ItemInstance } from "./types"

interface AssortmentTableProps {
  items: ItemInstance[]
}

export function AssortmentTable({ items }: AssortmentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  // const [expiryFilter, setExpiryFilter] = useState<string>("all")

  // const filteredItems = items.filter((item) => {
  //   if (expiryFilter === "all") {
  //     return true
  //   }

  //   const today = new Date()
  //   const expiry = new Date(item.expiryDate)
  //   const diffTime = expiry.getTime() - today.getTime()
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  //   if (expiryFilter === "expired") {
  //     return diffDays < 0
  //   }
  //   if (expiryFilter === "3days") {
  //     return diffDays >= 0 && diffDays <= 3
  //   }
  //   if (expiryFilter === "7days") {
  //     return diffDays >= 0 && diffDays <= 7
  //   }
  //   if (expiryFilter === "14days") {
  //     return diffDays >= 0 && diffDays <= 14
  //   }

  //   return true
  // })

  const table = useReactTable({
    data: items,
    columns: assortmentColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      const name = row.original.definition.name.toLowerCase()
      const category = row.original.definition.category.toLowerCase()
      return name.includes(searchValue) || category.includes(searchValue)
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
