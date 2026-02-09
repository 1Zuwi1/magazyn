"use client"

import {
  Clock01Icon,
  DatabaseRestoreIcon,
  EyeIcon,
  MoreHorizontalIcon,
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
import { useState } from "react"
import {
  SortableHeader,
  StaticHeader,
} from "@/components/dashboard/items/sortable-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NoItemsEmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatBytes, formatDateTime } from "../lib/utils"
import { type Backup, getBackupStatusConfig } from "./types"

function StatusBadge({ status }: { status: Backup["status"] }) {
  const { label, variant } = getBackupStatusConfig(status)
  return <Badge variant={variant}>{label}</Badge>
}

interface BackupsTableProps {
  backups: Backup[]
  onView: (backup: Backup) => void
  onRestore: (backup: Backup) => void
  onDelete: (backup: Backup) => void
  onCreateManual: () => void
}

function createColumns(
  onView: (backup: Backup) => void,
  onRestore: (backup: Backup) => void,
  onDelete: (backup: Backup) => void
): ColumnDef<Backup>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Nazwa</SortableHeader>
      ),
      cell: ({ row }) => {
        const backup = row.original
        return (
          <div>
            <div className="font-medium">{backup.name}</div>
            <div className="font-mono text-muted-foreground text-xs">
              #{backup.id}
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      enableSorting: true,
    },
    {
      accessorKey: "warehouseName",
      header: () => <StaticHeader>Magazyn</StaticHeader>,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.warehouseName ?? "Wszystkie"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "sizeBytes",
      header: ({ column }) => (
        <SortableHeader column={column}>Rozmiar</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.sizeBytes != null
            ? formatBytes(row.original.sizeBytes)
            : "—"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Utworzony</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <HugeiconsIcon
            className="size-3.5 text-muted-foreground"
            icon={Clock01Icon}
          />
          {formatDateTime(row.original.createdAt)}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <StaticHeader>Akcje</StaticHeader>,
      cell: ({ row }) => {
        const backup = row.original
        const canRestore = backup.status === "COMPLETED"

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
              <DropdownMenuItem onClick={() => onView(backup)}>
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={EyeIcon} />
                Szczegóły
              </DropdownMenuItem>
              {canRestore && (
                <DropdownMenuItem onClick={() => onRestore(backup)}>
                  <HugeiconsIcon
                    className="mr-2 h-4 w-4"
                    icon={DatabaseRestoreIcon}
                  />
                  Przywróć
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(backup)}
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

export function BackupsTable({
  backups,
  onView,
  onRestore,
  onDelete,
  onCreateManual,
}: BackupsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = createColumns(onView, onRestore, onDelete)

  const table = useReactTable({
    data: backups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
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
                  <NoItemsEmptyState
                    itemName="kopia zapasowa"
                    onAdd={onCreateManual}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            {totalItems > 0 ? (
              <>
                Wyświetlanie{" "}
                <span className="font-medium text-foreground">{startItem}</span>
                –<span className="font-medium text-foreground">{endItem}</span>{" "}
                z{" "}
                <span className="font-medium text-foreground">
                  {totalItems}
                </span>{" "}
                kopii
              </>
            ) : (
              "Brak wyników"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="sm"
              variant="outline"
            >
              Poprzednia
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                      pageNum === currentPage
                        ? "bg-primary font-medium text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    key={pageNum}
                    onClick={() => table.setPageIndex(pageNum - 1)}
                    type="button"
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
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
      )}
    </div>
  )
}
