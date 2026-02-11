"use client"

import {
  Calendar03Icon,
  Csv01Icon,
  FileDownloadIcon,
  Pdf01Icon,
  Time02Icon,
  Xls01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
import {
  EXPIRY_REPORT,
  formatDate,
  getExpiryStatus,
  REPORT_FORMATS,
} from "../lib/data"
import { type ExportFormat, exportReport } from "../lib/export-utils"
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

interface ExpiryRowProps {
  row: ExpiryReportRow
  isSelected: boolean
  onToggle: (id: string, checked: boolean) => void
}

function ExpiryRow({ row, isSelected, onToggle }: ExpiryRowProps) {
  const status = getExpiryStatus(row.daysLeft)

  return (
    <TableRow
      className={cn("transition-colors", getRowHighlight(row.daysLeft))}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell className="w-[50px] px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggle(row.id, !!checked)}
        />
      </TableCell>
      <TableCell className="font-medium">{row.item}</TableCell>
      <TableCell className="font-mono text-xs">{row.rack}</TableCell>
      <TableCell className="text-sm">{row.warehouse}</TableCell>
      <TableCell className="font-semibold tabular-nums">
        {row.quantity} {row.unit}
      </TableCell>
      <TableCell className="font-mono text-sm tabular-nums">
        {formatDate(row.expiryDate)}
      </TableCell>

      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
          row.rack.toLowerCase().includes(normalizedSearch) ||
          row.warehouse.toLowerCase().includes(normalizedSearch)
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

  const isAllSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.has(row.id))

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filtered.map((row) => row.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSelectedIds(next)
  }

  const stats = useMemo(() => {
    const expiredCount = EXPIRY_REPORT.filter((r) => r.daysLeft <= 0).length
    return { expiredCount }
  }, [])

  const handleExport = async () => {
    try {
      let exportFormat: ExportFormat = "csv"
      if (format === "pdf") {
        exportFormat = "pdf"
      } else if (format === "xlsx") {
        exportFormat = "xlsx"
      }

      await exportReport({
        filename: `terminy_waznosci_${new Date().toISOString().split("T")[0]}`,
        format: exportFormat,
        data:
          selectedIds.size > 0
            ? filtered.filter((row) => selectedIds.has(row.id))
            : filtered,
        columns: [
          { header: "Produkt", key: "item" },
          { header: "Regał", key: "rack" },
          { header: "Magazyn", key: "warehouse" },
          {
            header: "Ilość",
            key: (row: ExpiryReportRow) => `${row.quantity} ${row.unit}`,
          },
          {
            header: "Data ważności",
            key: (row: ExpiryReportRow) => formatDate(row.expiryDate),
          },
          {
            header: "Dni do wygaśnięcia",
            key: "daysLeft",
          },
          {
            header: "Status",
            key: (row: ExpiryReportRow) => getExpiryStatus(row.daysLeft).label,
          },
        ],
      })
      toast.success("Raport został wygenerowany")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Błąd eksportu")
    }
  }

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
              Pozycje asortymentu z wygasającą datą ważności — przeterminowane i
              zbliżające się do końca terminu.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              onValueChange={(value) => setFormat(value as ReportFormat)}
              value={format}
            >
              <SelectTrigger className="min-w-[185px]">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    className={cn(
                      "size-4",
                      format === "xlsx" && "text-emerald-500",
                      format === "pdf" && "text-destructive",
                      format === "csv" && "text-blue-500"
                    )}
                    icon={
                      {
                        xlsx: Xls01Icon,
                        pdf: Pdf01Icon,
                        csv: Csv01Icon,
                      }[format]
                    }
                  />
                  <SelectValue placeholder="Wybierz format pliku" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {REPORT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        className={cn(
                          "size-4",
                          f.value === "xlsx" && "text-emerald-500",
                          f.value === "pdf" && "text-destructive",
                          f.value === "csv" && "text-blue-500"
                        )}
                        icon={
                          {
                            xlsx: Xls01Icon,
                            pdf: Pdf01Icon,
                            csv: Csv01Icon,
                          }[f.value]
                        }
                      />
                      {f.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              variant={selectedIds.size > 0 ? "default" : "outline"}
            >
              <HugeiconsIcon className="mr-2 size-4" icon={FileDownloadIcon} />
              {selectedIds.size > 0
                ? `Eksportuj zaznaczone (${selectedIds.size})`
                : "Eksportuj wszystko"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="border-b bg-muted/30 p-4">
        <SearchInput
          aria-label="Szukaj produktu, regału lub magazynu"
          onChange={setSearch}
          placeholder="Szukaj po nazwie, regale, magazynie..."
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
                  <TableHead className="w-[50px] px-4">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => toggleAll(!!checked)}
                    />
                  </TableHead>
                  <SortableTableHead
                    active={sortField === "item"}
                    direction={sortDirection}
                    onSort={() => handleSort("item")}
                  >
                    Produkt
                  </SortableTableHead>
                  <TableHead>Regał</TableHead>
                  <TableHead>Magazyn</TableHead>
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

                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <ExpiryRow
                    isSelected={selectedIds.has(row.id)}
                    key={row.id}
                    onToggle={toggleOne}
                    row={row}
                  />
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
