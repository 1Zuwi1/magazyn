"use client"

import {
  Alert01Icon,
  Calendar03Icon,
  FileDownloadIcon,
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
import {
  EXPIRY_REPORT,
  formatDate,
  getExpiryStatus,
  REPORT_FORMATS,
} from "../lib/data"
import type { ExpiryReportRow, ReportFormat } from "../lib/types"
import { SortableTableHead } from "./sortable-table-head"

type SortField = "daysLeft" | "item" | "expiryDate" | "quantity"
type SortDirection = "asc" | "desc"

const getRowHighlight = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return "bg-destructive/5 hover:bg-destructive/10"
  }
  if (daysLeft <= 3) {
    return "bg-destructive/3 hover:bg-destructive/5"
  }
  if (daysLeft <= 10) {
    return "bg-orange-500/3 hover:bg-orange-500/5"
  }
  return ""
}

const getExpiryTooltip = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return "Produkt przeterminowany — wymagana natychmiastowa reakcja"
  }
  if (daysLeft <= 3) {
    return "Krytycznie krótka data — pilna akcja wymagana"
  }
  if (daysLeft <= 10) {
    return "Zbliżająca się data ważności — zaplanuj rotację"
  }
  return "Data ważności w normie"
}

interface ExpiryRowProps {
  row: ExpiryReportRow
}

function ExpiryRow({ row }: ExpiryRowProps) {
  const status = getExpiryStatus(row.daysLeft)
  const daysLabel = row.daysLeft === 1 ? "dzień" : "dni"

  return (
    <TableRow
      className={cn("transition-colors", getRowHighlight(row.daysLeft))}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{row.item}</span>
          <span className="text-muted-foreground text-xs">{row.category}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">{row.batch}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{row.warehouse}</span>
          <span className="text-muted-foreground text-xs">{row.rack}</span>
        </div>
      </TableCell>
      <TableCell className="font-semibold tabular-nums">
        {row.quantity} {row.unit}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono text-sm tabular-nums">
            {formatDate(row.expiryDate)}
          </span>
          {row.daysLeft <= 0 ? (
            <span className="font-medium text-destructive text-xs">
              Przeterminowane
            </span>
          ) : (
            <span className="text-muted-foreground text-xs tabular-nums">
              za {row.daysLeft} {daysLabel}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <Badge variant={status.variant}>
              {row.daysLeft <= 0 && (
                <HugeiconsIcon className="mr-0.5 size-3" icon={Alert01Icon} />
              )}
              {status.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getExpiryTooltip(row.daysLeft)}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

interface ExpiryReportCardProps {
  soonExpiry: number
}

export function ExpiryReportCard({ soonExpiry }: ExpiryReportCardProps) {
  const [format, setFormat] = useState<ReportFormat>("xlsx")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("daysLeft")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = [...EXPIRY_REPORT]

    if (search.trim()) {
      const normalizedSearch = search.toLowerCase()
      result = result.filter(
        (row) =>
          row.item.toLowerCase().includes(normalizedSearch) ||
          row.batch.toLowerCase().includes(normalizedSearch) ||
          row.rack.toLowerCase().includes(normalizedSearch) ||
          row.category.toLowerCase().includes(normalizedSearch)
      )
    }

    result.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1
      if (sortField === "item") {
        return multiplier * a.item.localeCompare(b.item)
      }
      if (sortField === "expiryDate") {
        return multiplier * a.expiryDate.localeCompare(b.expiryDate)
      }
      if (sortField === "quantity") {
        return multiplier * (a.quantity - b.quantity)
      }
      return multiplier * (a.daysLeft - b.daysLeft)
    })

    return result
  }, [search, sortField, sortDirection])

  const stats = useMemo(() => {
    const expiredCount = EXPIRY_REPORT.filter((r) => r.daysLeft <= 0).length
    return { expiredCount }
  }, [])

  return (
    <Card>
      <CardHeader className="gap-2 border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Calendar03Icon}
              />
              Raport dat ważności
            </CardTitle>
            <CardDescription>
              Pozycje asortymentu z wygasającą datą ważności w najbliższych 30
              dniach.
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
          aria-label="Szukaj asortymentu, partii lub regału"
          onChange={setSearch}
          placeholder="Szukaj po nazwie, partii, regale, kategorii..."
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
                  <TableHead>Partia</TableHead>
                  <TableHead>Lokalizacja</TableHead>
                  <SortableTableHead
                    active={sortField === "quantity"}
                    direction={sortDirection}
                    onSort={() => handleSort("quantity")}
                  >
                    Ilość
                  </SortableTableHead>
                  <SortableTableHead
                    active={sortField === "expiryDate"}
                    direction={sortDirection}
                    onSort={() => handleSort("expiryDate")}
                  >
                    Data ważności
                  </SortableTableHead>
                  <SortableTableHead
                    active={sortField === "daysLeft"}
                    direction={sortDirection}
                    onSort={() => handleSort("daysLeft")}
                  >
                    Status
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <ExpiryRow key={row.id} row={row} />
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
            Ostatnia aktualizacja: 10.02.2026, 09:40
          </div>
          {stats.expiredCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Przeterminowane</Badge>
              {stats.expiredCount} pozycji
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="warning">Wkrótce</Badge>
            {soonExpiry} pozycji w przedziale 10 dni
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
