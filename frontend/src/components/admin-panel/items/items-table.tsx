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
  ErrorEmptyState,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"

interface AdminItemsTableProps {
  currentPage: number
  totalPages: number
  items: Item[]
  search: string
  debouncedSearch: string
  onSetPage: (nextPage: number) => void
  onSearchChange: (value: string) => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  onUploadPhoto: (item: Item) => void
  isError: boolean
  isLoading: boolean
  refetch: () => void
}

function createColumns(
  t: ReturnType<typeof useAppTranslations>,
  onEdit: (item: Item) => void,
  onDelete: (item: Item) => void,
  onUploadPhoto: (item: Item) => void
): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.shared.name")}
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
      header: () => (
        <StaticHeader>{t("generated.admin.items.dimensionsMm")}</StaticHeader>
      ),
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
        <SortableHeader column={column}>
          {t("generated.admin.items.weightKg")}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.weight}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "temperature",
      header: () => (
        <StaticHeader>{t("generated.shared.temperature")}</StaticHeader>
      ),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="font-mono text-sm">
            {t("generated.shared.cC", {
              value0: item.minTemp,
              value1: item.maxTemp,
            })}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "daysToExpiry",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.admin.items.shelfLifeDays")}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.daysToExpiry}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "isDangerous",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.shared.status")}
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const item = row.original
        return item.isDangerous ? (
          <Badge variant="destructive">{t("generated.shared.dangerous")}</Badge>
        ) : (
          <Badge variant="secondary">{t("generated.shared.safe")}</Badge>
        )
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <StaticHeader>{t("generated.shared.shares")}</StaticHeader>,
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("generated.shared.openMenu")}>
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
                {item.imageUrl
                  ? t("generated.admin.items.changePhoto")
                  : t("generated.admin.items.addPhoto")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
                {t("generated.shared.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(item)}
              >
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                {t("generated.shared.remove")}
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
  search,
  debouncedSearch,
  onSetPage,
  onSearchChange,
  onEdit,
  onDelete,
  onUploadPhoto,
  isError,
  isLoading,
  refetch,
}: AdminItemsTableProps) {
  const t = useAppTranslations()

  const [sorting, setSorting] = useState<SortingState>([])

  const columns = createColumns(t, onEdit, onDelete, onUploadPhoto)

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const filteredCount = items.length
  const totalCount = items.length
  const isFiltered =
    debouncedSearch.trim().length > 0 || search.trim().length > 0

  const clearAllFilters = () => {
    onSearchChange("")
  }

  const itemLabel = {
    singular: t("generated.shared.item"),
    plural: t("generated.shared.items2"),
    genitive: t("generated.shared.items3"),
  }

  const getTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }, (_, i) => (
        <TableRow key={`skeleton-${i.toString()}`}>
          {columns.map((column, index) => (
            <TableCell key={`${column.id}-${index}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }
    if (isError) {
      return (
        <TableRow>
          <TableCell className="p-0" colSpan={columns.length}>
            <ErrorEmptyState onRetry={refetch} />
          </TableCell>
        </TableRow>
      )
    }

    const tableRows = table.getRowModel().rows

    if (tableRows.length === 0) {
      return (
        <TableRow>
          <TableCell className="p-0" colSpan={columns.length}>
            {isFiltered ? (
              <FilterEmptyState onClear={clearAllFilters} />
            ) : (
              <NoItemsEmptyState itemName="przedmiot" />
            )}
          </TableCell>
        </TableRow>
      )
    }
    return tableRows.map((row) => (
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
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <FilterBar className="gap-3">
          <FilterGroup>
            <SearchInput
              aria-label={t("generated.admin.items.filterItemsNameId")}
              onChange={onSearchChange}
              placeholder={t("generated.admin.items.searchNameId")}
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
        <TableBody>{getTableContent()}</TableBody>
      </Table>
      <PaginationFull
        currentPage={currentPage}
        setPage={onSetPage}
        totalPages={totalPages}
        variant="compact"
      />
    </div>
  )
}
