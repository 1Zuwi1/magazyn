"use client"

import {
  Clock01Icon,
  DatabaseRestoreIcon,
  EyeIcon,
  MoreHorizontalIcon,
  Refresh01Icon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import {
  SortableHeader,
  StaticHeader,
} from "@/components/dashboard/items/sortable-header"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
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
import { Label } from "@/components/ui/label"
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
import useBackups from "@/hooks/use-backups"
import type { AppTranslate } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import {
  BACKUPS_PAGE_SIZE,
  getBackupsSortParams,
} from "../lib/backups-table-query"
import type { Backup } from "../types"
import { mapApiBackupToViewModel } from "../utils"
import { BackupStatusBadge } from "./backup-status-badge"
import { WarehouseSelector } from "./warehouse-selector"

interface BackupsTableProps {
  onView: (backup: Backup) => void
  onRestore: (backup: Backup) => void
  onRetry: (backup: Backup) => void
  onDelete: (backup: Backup) => void
  onCreateManual: () => void
}

function createColumns(
  t: AppTranslate,
  locale: string,
  onView: (backup: Backup) => void,
  onRestore: (backup: Backup) => void,
  onRetry: (backup: Backup) => void,
  onDelete: (backup: Backup) => void
): ColumnDef<Backup>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.shared.name")}
        </SortableHeader>
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
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.shared.status")}
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const backup = row.original
        const isInProgress =
          backup.status === "IN_PROGRESS" || backup.status === "RESTORING"
        const hasProgress = isInProgress && backup.progress != null

        if (hasProgress) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-32">
                <div className="mb-2 flex items-center justify-start">
                  <BackupStatusBadge status={backup.status} />
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${backup.progress}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 animate-pulse rounded-full bg-primary/30"
                    style={{ width: `${backup.progress}%` }}
                  />
                </div>
                <span className="mt-0.5 block text-right font-mono text-[10px] text-muted-foreground">
                  {backup.progress}%
                </span>
              </div>
            </div>
          )
        }

        return <BackupStatusBadge status={backup.status} />
      },
      enableSorting: true,
    },
    {
      accessorKey: "warehouseName",
      header: () => (
        <StaticHeader>{t("generated.shared.warehouse")}</StaticHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.warehouseName}</span>
      ),
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("generated.shared.created")}
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <HugeiconsIcon
            className="size-3.5 text-muted-foreground"
            icon={Clock01Icon}
          />
          {formatDateTime(row.original.createdAt, locale)}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => (
        <StaticHeader>
          {t("generated.admin.backups.actionsHeader")}
        </StaticHeader>
      ),
      cell: ({ row }) => {
        const backup = row.original
        const canRestore = backup.status === "COMPLETED"
        const isInProgress =
          backup.status === "IN_PROGRESS" || backup.status === "RESTORING"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("generated.admin.backups.openBackupMenu")}
            >
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
                {t("generated.admin.backups.detailsAction")}
              </DropdownMenuItem>
              {canRestore && (
                <DropdownMenuItem onClick={() => onRestore(backup)}>
                  <HugeiconsIcon
                    className="mr-2 h-4 w-4"
                    icon={DatabaseRestoreIcon}
                  />
                  {t("generated.admin.backups.restoreAction")}
                </DropdownMenuItem>
              )}
              {backup.status === "FAILED" && (
                <DropdownMenuItem onClick={() => onRetry(backup)}>
                  <HugeiconsIcon
                    className="mr-2 h-4 w-4"
                    icon={Refresh01Icon}
                  />
                  {t("generated.admin.backups.retryAction")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                disabled={isInProgress}
                onClick={() => onDelete(backup)}
              >
                <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
                {isInProgress
                  ? t("generated.admin.backups.statusInProgress")
                  : t("generated.shared.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]
}

function getRowClassName(row: Row<Backup>) {
  const status = row.original.status
  if (status === "IN_PROGRESS") {
    return "bg-orange-500/[0.03] dark:bg-orange-500/[0.06]"
  }
  if (status === "RESTORING") {
    return "bg-primary/[0.03] dark:bg-primary/[0.06]"
  }
  if (status === "FAILED") {
    return "bg-destructive/[0.03] dark:bg-destructive/[0.06]"
  }
  return ""
}

export function BackupsTable({
  onView,
  onRestore,
  onRetry,
  onDelete,
  onCreateManual,
}: BackupsTableProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [sorting, setSorting] = useState<SortingState>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [warehouseIdFilter, setWarehouseIdFilter] = useState<number | null>(
    null
  )

  const sortingQuery = useMemo(() => getBackupsSortParams(sorting), [sorting])

  const {
    data: backupsData,
    isError,
    isPending,
    refetch: refetchBackups,
  } = useBackups({
    page: currentPage - 1,
    size: BACKUPS_PAGE_SIZE,
    warehouseId: warehouseIdFilter ?? undefined,
    ...sortingQuery,
  })

  const backups = useMemo(
    () =>
      (backupsData?.content ?? []).map((backup) =>
        mapApiBackupToViewModel(backup, t)
      ),
    [backupsData?.content, t]
  )
  const totalPages = Math.max(backupsData?.totalPages ?? 1, 1)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)
    setCurrentPage(boundedPage)
  }

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((previousSorting) =>
      typeof updater === "function" ? updater(previousSorting) : updater
    )
    setCurrentPage(1)
  }

  const handleWarehouseFilterChange = (warehouseId: number | null) => {
    setWarehouseIdFilter(warehouseId)
    setCurrentPage(1)
  }

  const columns = createColumns(t, locale, onView, onRestore, onRetry, onDelete)

  const table = useReactTable({
    data: backups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: handleSortingChange,
    state: {
      sorting,
    },
  })

  const safeTotalPages = Math.max(totalPages, 1)

  const rows = table.getRowModel().rows
  const backupItemLabel = {
    singular: t("generated.admin.backups.backupItemLabel"),
    plural: t("generated.admin.backups.backupItemLabelPlural"),
    genitive: t("generated.admin.backups.backupItemLabelGenitive"),
  }
  const noBackupsDescription = t("generated.ui.noItemsDescription", {
    value0: 0,
    singular: backupItemLabel.singular,
    plural: backupItemLabel.plural,
    genitive: backupItemLabel.genitive,
  })
  const noBackupsTitle = t("generated.ui.noItemsTitle", {
    value0: 0,
    singular: backupItemLabel.singular,
    plural: backupItemLabel.plural,
    genitive: backupItemLabel.genitive,
  })
  const isFiltered = warehouseIdFilter != null

  const getTableContent = () => {
    if (isPending) {
      return Array.from({ length: 6 }, (_, rowIndex) => (
        <TableRow key={`backup-skeleton-row-${rowIndex.toString()}`}>
          {columns.map((column, columnIndex) => (
            <TableCell
              key={`backup-skeleton-cell-${column.id ?? columnIndex.toString()}-${columnIndex.toString()}`}
            >
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
            <ErrorEmptyState className="py-10" onRetry={refetchBackups} />
          </TableCell>
        </TableRow>
      )
    }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell className="p-0" colSpan={columns.length}>
            {isFiltered ? (
              <FilterEmptyState
                onClear={() => {
                  handleWarehouseFilterChange(null)
                }}
              />
            ) : (
              <NoItemsEmptyState
                description={noBackupsDescription}
                icon={DatabaseRestoreIcon}
                itemName={backupItemLabel.singular}
                onAdd={onCreateManual}
                title={noBackupsTitle}
              />
            )}
          </TableCell>
        </TableRow>
      )
    }

    return rows.map((row) => (
      <TableRow
        className={cn(
          "group transition-all duration-300 hover:bg-muted/50",
          getRowClassName(row)
        )}
        key={row.id}
      >
        {row.getVisibleCells().map((cell, cellIndex) => (
          <TableCell
            className={cn(
              "px-4 py-3",
              cellIndex === 0 &&
                "border-l-2 border-l-transparent transition-colors group-hover:border-l-primary/40"
            )}
            key={cell.id}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-t-2 border-t-primary/60" />
      <div className="border-b bg-muted/20 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3 sm:max-w-md">
          <Label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm"
            htmlFor="backups-warehouse-filter"
          >
            {t("generated.shared.warehouse")}
          </Label>
          <WarehouseSelector
            allOptionLabel={t("generated.admin.backups.allWarehouses")}
            id="backups-warehouse-filter"
            includeAllOption
            onValueChange={(warehouseId) => {
              handleWarehouseFilterChange(warehouseId)
            }}
            placeholder={t("generated.shared.searchWarehouse")}
            value={warehouseIdFilter}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="border-b bg-muted/40 hover:bg-muted/40"
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
      </div>

      <PaginationFull
        currentPage={currentPage}
        setPage={handlePageChange}
        totalPages={safeTotalPages}
        variant="compact"
      />
    </div>
  )
}
