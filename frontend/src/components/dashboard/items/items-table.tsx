"use client"

import { useDebouncedValue } from "@tanstack/react-pacer"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ErrorEmptyState,
  NoItemsEmptyState,
  SearchEmptyState,
} from "@/components/ui/empty-state"
import {
  ClearFiltersButton,
  FilterBar,
  FilterGroup,
  FilterResults,
  SearchInput,
} from "@/components/ui/filter-bar"
import { ItemPhoto } from "@/components/ui/item-photo"
import PaginationFull from "@/components/ui/pagination-component"
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
import { translateMessage } from "@/i18n/translate-message"
import { CodeCell } from "./components/code-cell"
import { SortableHeader, StaticHeader } from "./sortable-header"

const SKELETON_ROWS = 5

function ItemsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
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
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 w-32" />
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
      <SortableHeader column={column}>
        {translateMessage("generated.shared.name")}
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3">
          <ItemPhoto
            alt={item.name}
            containerClassName="h-10 w-10 shrink-0 rounded"
            src={`/api/items/${item.id}/photo`}
            zoomable
          />
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.shared.code")}
      </SortableHeader>
    ),
    cell: ({ row }) => <CodeCell value={row.original.code} />,
    enableSorting: true,
  },
  {
    id: "dimensions",
    accessorFn: (item) => `${item.sizeX}×${item.sizeY}×${item.sizeZ}`,
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.dashboard.shared.dimensions")}
      </SortableHeader>
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
      <SortableHeader column={column}>
        {translateMessage("generated.shared.weight")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono">
        {row.original.weight} {translateMessage("generated.shared.kg")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "expireAfterDays",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.dashboard.shared.shelfLife")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {translateMessage("generated.dashboard.shared.pluralLabel", {
          value0: row.original.expireAfterDays,
        })}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "dangerous",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.shared.status")}
      </SortableHeader>
    ),
    cell: ({ row }) =>
      row.original.dangerous ? (
        <Badge variant="destructive">
          {translateMessage("generated.shared.dangerous")}
        </Badge>
      ) : (
        <Badge variant="secondary">
          {translateMessage("generated.shared.safe")}
        </Badge>
      ),
    enableSorting: true,
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: () => (
      <StaticHeader>
        {translateMessage("generated.shared.comment")}
      </StaticHeader>
    ),
    cell: ({ row }) => (
      <span className="line-clamp-2 text-muted-foreground text-sm">
        {row.original.comment || "Brak"}
      </span>
    ),
    enableSorting: false,
  },
]

export function ItemsTable({ isLoading, initialSearch = "" }: ItemsTableProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch] = useDebouncedValue(search, { wait: 500 })

  const {
    data: items,
    isPending,
    isError,
    refetch,
  } = useItems({
    page: page - 1,
    size: 10,
    search: debouncedSearch.trim() || undefined,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const tableData = items?.content ?? []
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch)
      setPage(1)
      const sp = new URLSearchParams(searchParams)
      sp.delete("search")
      router.push(`${pathname}?${sp.toString()}`)
    }
  }, [initialSearch, router, pathname, searchParams])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const table = useReactTable({
    data: tableData,
    columns: itemsColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  if (isLoading || isPending) {
    return <ItemsTableSkeleton />
  }

  if (isError) {
    return <ErrorEmptyState onRetry={() => refetch()} />
  }

  const filteredCount = tableData.length
  const totalCount = items?.totalElements ?? filteredCount
  const isFiltered =
    debouncedSearch.trim().length > 0 || search.trim().length > 0
  const totalPages = items?.totalPages ?? 1

  const itemLabel = {
    singular: translateMessage("generated.shared.item"),
    plural: translateMessage("generated.shared.items2"),
    genitive: translateMessage("generated.shared.items3"),
  }

  const clearAllFilters = () => {
    handleSearchChange("")
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <FilterBar className="gap-3">
          <FilterGroup>
            <SearchInput
              aria-label={translateMessage(
                "generated.dashboard.items.searchItems"
              )}
              onChange={handleSearchChange}
              placeholder={translateMessage(
                "generated.dashboard.items.searchNameCodeComment"
              )}
              value={search}
            />
            {isFiltered && <ClearFiltersButton onClick={clearAllFilters} />}
          </FilterGroup>
          <FilterResults
            filteredCount={filteredCount}
            isFiltered={isFiltered}
            itemLabel={itemLabel}
            totalCount={totalCount}
          />
        </FilterBar>
      </div>

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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="p-0" colSpan={itemsColumns.length}>
                {isFiltered ? (
                  <SearchEmptyState onClear={clearAllFilters} />
                ) : (
                  <NoItemsEmptyState itemName="przedmiot" />
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationFull
        currentPage={page}
        setPage={setPage}
        totalPages={totalPages}
        variant="compact"
      />
    </div>
  )
}
