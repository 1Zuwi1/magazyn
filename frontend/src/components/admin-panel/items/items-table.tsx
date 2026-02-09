"use client"

import {
  ImageUploadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import {
  SortableHeader,
  StaticHeader,
} from "@/components/dashboard/items/sortable-header"
import type { Item } from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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
import { ItemPhoto } from "@/components/ui/item-photo"
import PaginationFull from "@/components/ui/pagination-component"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AdminItemsTableProps {
  currentPage: number
  totalPages: number
  items: Item[]
  onSetPage: (nextPage: number) => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  onUploadPhoto: (item: Item) => void
}

function createColumns(
  onEdit: (item: Item) => void,
  onDelete: (item: Item) => void,
  onUploadPhoto: (item: Item) => void
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
            <ItemPhoto
              alt={item.name}
              containerClassName="h-10 w-10 shrink-0 rounded"
              src={`/api/items/${item.id}/photo`}
              zoomable
            />
            <div>
              <div className="font-medium">{item.name}</div>
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
            <DropdownMenuContent align="end" className="w-fit">
              <DropdownMenuItem onClick={() => onUploadPhoto(item)}>
                <HugeiconsIcon
                  className="mr-2 h-4 w-4"
                  icon={ImageUploadIcon}
                />
                {item.imageUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
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

export function AdminItemsTable({
  currentPage,
  totalPages,
  items,
  onSetPage,
  onEdit,
  onDelete,
  onUploadPhoto,
}: AdminItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = createColumns(onEdit, onDelete, onUploadPhoto)

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
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
        item.id.toString().includes(normalizedSearchValue) ||
        (item.comment?.toLowerCase().includes(normalizedSearchValue) ?? false)
      )
    },
    state: {
      sorting,
      globalFilter,
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = items.length
  const isFiltered = globalFilter.length > 0

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
      <PaginationFull
        currentPage={currentPage}
        setPage={onSetPage}
        totalPages={totalPages}
      />
    </div>
  )
}
