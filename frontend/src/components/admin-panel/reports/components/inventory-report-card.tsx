"use client"

import {
  FileDownloadIcon,
  PackageIcon,
  Time02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SearchEmptyState } from "@/components/ui/empty-state"
import { SearchInput } from "@/components/ui/filter-bar"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDateTime, INVENTORY_REPORT, REPORT_FORMATS } from "../lib/data"
import type { InventoryReportRow, ReportFormat } from "../lib/types"
import { SortableTableHead } from "./sortable-table-head"

type SortField = "item" | "quantity" | "status" | "lastUpdated"
type SortDirection = "asc" | "desc"

const STATUS_ORDER = { LOW: 0, OVERSTOCK: 1, OK: 2 }

const getInventoryStatusBadge = (status: InventoryReportRow["status"]) => {
  if (status === "LOW") {
    return { label: "Niski stan", variant: "warning" as const }
  }
  if (status === "OVERSTOCK") {
    return { label: "Nadmiar", variant: "destructive" as const }
  }
  return { label: "W normie", variant: "success" as const }
}

const getRowHighlightByStatus = (status: InventoryReportRow["status"]) => {
  if (status === "LOW") {
    return "bg-orange-500/3 hover:bg-orange-500/5"
  }
  if (status === "OVERSTOCK") {
    return "bg-destructive/3 hover:bg-destructive/5"
  }
  return ""
}

const getStatusTooltip = (row: InventoryReportRow) => {
  const diff = row.quantity - row.minQuantity
  if (row.status === "LOW") {
    return `Brakuje ${Math.abs(diff)} ${row.unit} do minimalnego poziomu (${row.minQuantity} ${row.unit})`
  }
  if (row.status === "OVERSTOCK") {
    const overstock = row.quantity - row.maxQuantity
    return `Nadmiar: ${overstock} ${row.unit} ponad maksymalny poziom (${row.maxQuantity} ${row.unit})`
  }
  return `Stan w normie: ${row.minQuantity}–${row.maxQuantity} ${row.unit}`
}

interface InventoryRowProps {
  row: InventoryReportRow
}

function InventoryRow({ row }: InventoryRowProps) {
  const badge = getInventoryStatusBadge(row.status)

  return (
    <TableRow
      className={cn("transition-colors", getRowHighlightByStatus(row.status))}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{row.item}</span>
          <span className="text-muted-foreground text-xs">{row.category}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">{row.sku}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{row.warehouse}</span>
          <span className="text-muted-foreground text-xs">{row.rack}</span>
        </div>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <span className="font-semibold tabular-nums">
              {row.quantity} {row.unit}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusTooltip(row)}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono text-muted-foreground text-xs tabular-nums">
          {row.minQuantity} – {row.maxQuantity} {row.unit}
        </span>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusTooltip(row)}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="text-right font-mono text-muted-foreground text-xs tabular-nums">
        {formatDateTime(row.lastUpdated)}
      </TableCell>
    </TableRow>
  )
}

export function InventoryReportCard() {
  const [format, setFormat] = useState<ReportFormat>("xlsx")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("item")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "lastUpdated" ? "desc" : "asc")
    }
  }

  const filtered = useMemo(() => {
    let result = [...INVENTORY_REPORT]

    if (search.trim()) {
      const normalizedSearch = search.toLowerCase()
      result = result.filter(
        (row) =>
          row.item.toLowerCase().includes(normalizedSearch) ||
          row.sku.toLowerCase().includes(normalizedSearch) ||
          row.rack.toLowerCase().includes(normalizedSearch) ||
          row.category.toLowerCase().includes(normalizedSearch)
      )
    }

    result.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1
      if (sortField === "item") {
        return multiplier * a.item.localeCompare(b.item)
      }
      if (sortField === "quantity") {
        return multiplier * (a.quantity - b.quantity)
      }
      if (sortField === "lastUpdated") {
        return multiplier * a.lastUpdated.localeCompare(b.lastUpdated)
      }
      return multiplier * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    })

    return result
  }, [search, sortField, sortDirection])

  const summary = useMemo(() => {
    const totalQuantity = INVENTORY_REPORT.reduce(
      (sum, row) => sum + row.quantity,
      0
    )
    const lowCount = INVENTORY_REPORT.filter(
      (row) => row.status === "LOW"
    ).length
    const overstockCount = INVENTORY_REPORT.filter(
      (row) => row.status === "OVERSTOCK"
    ).length
    return { totalQuantity, lowCount, overstockCount }
  }, [])

  return (
    <Card>
      <CardHeader className="gap-2 border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={PackageIcon}
              />
              Pełna inwentaryzacja magazynu
            </CardTitle>
            <CardDescription>
              Zestawienie aktualnych stanów magazynowych z progami min/max
              według lokalizacji i SKU.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              onValueChange={(value) => setFormat(value as ReportFormat)}
              value={format}
            >
              <SelectTrigger className="min-w-[170px]">
                <SelectValue placeholder="Wybierz format pliku" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <HugeiconsIcon className="mr-2 size-4" icon={FileDownloadIcon} />
              Pobierz raport
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="border-b bg-muted/30 p-4">
        <SearchInput
          aria-label="Szukaj asortymentu, SKU lub regału"
          onChange={setSearch}
          placeholder="Szukaj po nazwie, SKU, regale, kategorii..."
          value={search}
        />
      </div>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <SearchEmptyState onClear={() => setSearch("")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    active={sortField === "item"}
                    direction={sortDirection}
                    onSort={() => handleSort("item")}
                  >
                    Asortyment
                  </SortableTableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Lokalizacja</TableHead>
                  <SortableTableHead
                    active={sortField === "quantity"}
                    direction={sortDirection}
                    onSort={() => handleSort("quantity")}
                  >
                    Stan magazynowy
                  </SortableTableHead>
                  <TableHead className="text-center">Zakresy min/max</TableHead>
                  <SortableTableHead
                    active={sortField === "status"}
                    direction={sortDirection}
                    onSort={() => handleSort("status")}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    active={sortField === "lastUpdated"}
                    className="text-right"
                    direction={sortDirection}
                    onSort={() => handleSort("lastUpdated")}
                  >
                    Aktualizacja
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <InventoryRow key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <HugeiconsIcon className="size-3.5" icon={Time02Icon} />
            Ostatnia aktualizacja: 10.02.2026, 10:15
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Niski stan</Badge>
            {summary.lowCount} pozycji
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Nadmiar</Badge>
            {summary.overstockCount} pozycji
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Razem</Badge>
            {summary.totalQuantity.toLocaleString("pl-PL")} szt. w{" "}
            {INVENTORY_REPORT.length} pozycjach
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
