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
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
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
import { createItemsColumns } from "./items-columns"
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
  const t = useTranslations()
  const translate = useMemo(
    () => (key: string, values?: Record<string, string | number>) =>
      t(key as never, values as never),
    [t]
  )
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const columns = useMemo(() => createItemsColumns(translate), [translate])

  const table = useReactTable({
    data: items,
    columns,
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
          aria-label={t("itemsTable.search.ariaLabel")}
          className="max-w-sm"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={t("itemsTable.search.placeholder")}
          value={globalFilter ?? ""}
        />
        <div className="ml-auto text-muted-foreground text-sm">
          {t("itemsTable.count", {
            count: table.getFilteredRowModel().rows.length,
          })}
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
                  colSpan={columns.length}
                >
                  {t("itemsTable.empty")}
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
          {t("common.pagination.previous")}
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          {t("common.pagination.next")}
        </Button>
      </div>
    </div>
  )
}
