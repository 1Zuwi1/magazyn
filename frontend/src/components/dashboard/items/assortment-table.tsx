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
import { useLocale, useTranslations } from "next-intl"
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
import { getDaysUntilExpiry } from "../utils/helpers"
import { createAssortmentColumns } from "./assortment-columns"
import type { ItemInstance } from "./types"

type ExpiryFilters = "14_DAYS" | "7_DAYS" | "3_DAYS" | "EXPIRED" | "ALL"

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
  const t = useTranslations("assortmentTable")
  const pagination = useTranslations("common.pagination")
  const locale = useLocale()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilters>("ALL")
  const expiryOptions = useMemo(
    () => [
      { value: "ALL", label: t("filters.all") },
      { value: "EXPIRED", label: t("filters.expired") },
      { value: "3_DAYS", label: t("filters.threeDays") },
      { value: "7_DAYS", label: t("filters.sevenDays") },
      { value: "14_DAYS", label: t("filters.fourteenDays") },
    ],
    [t]
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: next-intl translator is stable; locale changes drive updates.
  const columns = useMemo(
    () => createAssortmentColumns({ t, locale }),
    [locale]
  )

  const filteredItems = useMemo(
    () => items.filter((item) => matchesExpiryFilter(item, expiryFilter)),
    [items, expiryFilter]
  )

  const table = useReactTable({
    data: filteredItems,
    columns,
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
          aria-label={t("search.ariaLabel")}
          className="max-w-sm"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={t("search.placeholder")}
          value={globalFilter ?? ""}
        />

        <Select
          onValueChange={(value) => setExpiryFilter(value as ExpiryFilters)}
          value={expiryFilter}
        >
          <SelectTrigger aria-label={t("filters.ariaLabel")} className="w-44">
            <SelectValue
              render={
                <span>
                  {
                    expiryOptions.find(
                      (option) => option.value === expiryFilter
                    )?.label
                  }
                </span>
              }
            />
          </SelectTrigger>
          <SelectContent>
            {expiryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-muted-foreground text-sm">
          {t("count", {
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
                  {t("empty")}
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
          {pagination("previous")}
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          {pagination("next")}
        </Button>
      </div>
    </div>
  )
}
