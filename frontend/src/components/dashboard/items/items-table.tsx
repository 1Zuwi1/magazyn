"use client"

import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnDef,
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
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ErrorEmptyState,
  NoItemsEmptyState,
  SearchEmptyState,
} from "@/components/ui/empty-state"
import {
  FilterBar,
  FilterGroup,
  FilterResults,
  SearchInput,
} from "@/components/ui/filter-bar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useItems, { type Item } from "@/hooks/use-items"
import { CodeCell } from "./components/code-cell"
import { SortableHeader, StaticHeader } from "./sortable-header"

const SKELETON_ROWS = 5

function ItemsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter Bar Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3 w-28" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3 w-24" />
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
                {/* Name */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </TableCell>
                {/* Category */}
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                {/* Quantity */}
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                {/* Expiry */}
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                {/* Danger */}
                <TableCell className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
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

interface ItemsTableProps {
  isLoading?: boolean
  initialSearch?: string
}

const itemsColumns: ColumnDef<Item>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Nazwa</SortableHeader>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <SortableHeader column={column}>Kod</SortableHeader>
    ),
    cell: ({ row }) => <CodeCell value={row.original.code} />,
    enableSorting: true,
  },
  {
    id: "dimensions",
    accessorFn: (item) => `${item.sizeX}×${item.sizeY}×${item.sizeZ}`,
    header: ({ column }) => (
      <SortableHeader column={column}>Wymiary</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.sizeX} × {row.original.sizeY} × {row.original.sizeZ}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "weight",
    header: ({ column }) => (
      <SortableHeader column={column}>Waga</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.weight} kg</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "expireAfterDays",
    header: ({ column }) => (
      <SortableHeader column={column}>Ważność</SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.expireAfterDays} dni</Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "dangerous",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) =>
      row.original.dangerous ? (
        <Badge variant="destructive">Niebezpieczny</Badge>
      ) : (
        <Badge variant="secondary">Bezpieczny</Badge>
      ),
    enableSorting: true,
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: () => <StaticHeader>Komentarz</StaticHeader>,
    cell: ({ row }) => (
      <span className="line-clamp-2 text-muted-foreground text-sm">
        {row.original.comment || "Brak"}
      </span>
    ),
    enableSorting: false,
  },
]

const globalFilterFn: FilterFn<Item> = (row, _columnId, filterValue) => {
  const searchValue = filterValue?.toString().trim().toLowerCase()
  if (!searchValue) {
    return true
  }
  return (
    row.original.name.toLowerCase().includes(searchValue) ||
    row.original.code.toLowerCase().includes(searchValue) ||
    (row.original.comment?.toLowerCase().includes(searchValue) ?? false)
  )
}

export function ItemsTable({ isLoading, initialSearch = "" }: ItemsTableProps) {
  const { data: items, isPending, isError, refetch } = useItems()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState(initialSearch)
  const tableData = items?.content ?? []

  useEffect(() => {
    setGlobalFilter(initialSearch)
  }, [initialSearch])

  const table = useReactTable({
    data: tableData,
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

  if (isLoading || isPending) {
    return <ItemsTableSkeleton />
  }

  if (isError) {
    return <ErrorEmptyState onRetry={() => refetch()} />
  }

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = items?.totalElements ?? tableData.length
  const isFiltered = globalFilter.length > 0
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  const itemLabel = {
    singular: "przedmiot",
    plural: "przedmioty",
    genitive: "przedmiotów",
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar>
        <FilterGroup>
          <SearchInput
            aria-label="Szukaj przedmiotów"
            onChange={setGlobalFilter}
            placeholder="Szukaj po nazwie, kodzie lub komentarzu..."
            value={globalFilter}
          />
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
                <TableCell className="p-0" colSpan={itemsColumns.length}>
                  {isFiltered ? (
                    <SearchEmptyState onClear={() => setGlobalFilter("")} />
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
