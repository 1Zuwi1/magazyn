"use client"

import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import Image from "next/image"
import { useState } from "react"
import {
  SortableHeader,
  StaticHeader,
} from "@/components/dashboard/items/sortable-header"
import type { Item } from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FilterEmptyState,
  NoItemsEmptyState,
} from "@/components/ui/empty-state"
import {
  ClearFiltersButton,
  FilterBar,
  FilterGroup,
  FilterResults,
  SearchInput,
} from "@/components/ui/filter-bar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AdminAssortmentTableProps {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

function createColumns(
  onEdit: (item: Item) => void,
  onDelete: (item: Item) => void
): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Nazwa</SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <Image
                alt={item.name}
                className="h-10 w-10 rounded object-cover"
                height={40}
                src={
                  item.imageUrl.startsWith("/")
                    ? item.imageUrl
                    : `/images/items/${item.imageUrl}`
                }
                width={40}
              />
            )}
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="font-mono text-muted-foreground text-xs">
                {item.id}
              </div>
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: "dimensions",
      header: () => <StaticHeader>Wymiary (mm)</StaticHeader>,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="font-mono text-sm">
            {item.width} × {item.height} × {item.depth}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "weight",
      header: ({ column }) => (
        <SortableHeader column={column}>Waga (kg)</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.weight}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "temperature",
      header: () => <StaticHeader>Temperatura</StaticHeader>,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="font-mono text-sm">
            {item.minTemp}°C – {item.maxTemp}°C
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "daysToExpiry",
      header: ({ column }) => (
        <SortableHeader column={column}>Ważność (dni)</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.daysToExpiry}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "isDangerous",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original
        return item.isDangerous ? (
          <Badge variant="destructive">Niebezpieczny</Badge>
        ) : (
          <Badge variant="secondary">Bezpieczny</Badge>
        )
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <StaticHeader>Akcje</StaticHeader>,
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Otwórz menu">
              <HugeiconsIcon
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-xs" })
                )}
                icon={MoreHorizontalIcon}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log("View", item.id)}>
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={EyeIcon} />
                Szczegóły
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(item)}
              >
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]
}

export function AdminAssortmentTable({
  items,
  onEdit,
  onDelete,
}: AdminAssortmentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = createColumns(onEdit, onDelete)

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
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = filterValue?.toString().trim()
      if (!searchValue) {
        return true
      }
      const item = row.original
      const normalizedSearchValue = searchValue.toLowerCase()
      return (
        item.name.toLowerCase().includes(normalizedSearchValue) ||
        item.id.toLowerCase().includes(normalizedSearchValue) ||
        (item.comment?.toLowerCase().includes(normalizedSearchValue) ?? false)
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
  const isFiltered = globalFilter.length > 0
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  const clearAllFilters = () => {
    setGlobalFilter("")
  }

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
            aria-label="Filtruj przedmioty po nazwie lub ID"
            onChange={setGlobalFilter}
            placeholder="Szukaj po nazwie lub ID..."
            value={globalFilter}
          />

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
                <TableCell className="p-0" colSpan={columns.length}>
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
