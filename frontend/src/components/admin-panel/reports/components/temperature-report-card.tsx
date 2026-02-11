"use client"

import {
  FileDownloadIcon,
  ThermometerIcon,
  Time02Icon,
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
  formatDateTime,
  getSeverityConfig,
  REPORT_FORMATS,
  TEMPERATURE_REPORT,
} from "../lib/data"
import { type ExportFormat, exportReport } from "../lib/export-utils"
import type { ReportFormat, TemperatureReportRow } from "../lib/types"
import { SortableTableHead } from "./sortable-table-head"

type SortField = "deviation" | "recordedAt" | "severity"
type SortDirection = "asc" | "desc"

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, MINOR: 2 }

const getRowHighlightBySeverity = (severity: string) => {
  if (severity === "CRITICAL") {
    return "bg-destructive/3 hover:bg-destructive/5"
  }
  if (severity === "WARNING") {
    return "bg-orange-500/3 hover:bg-orange-500/5"
  }
  return ""
}

interface TemperatureRowProps {
  row: TemperatureReportRow
}

function TemperatureRow({ row }: TemperatureRowProps) {
  const severity = getSeverityConfig(row.severity)

  return (
    <TableRow
      className={cn(
        "transition-colors",
        getRowHighlightBySeverity(row.severity)
      )}
    >
      <TableCell>
        {row.item ? (
          <span className="font-medium">{row.item}</span>
        ) : (
          <span className="text-muted-foreground italic">Cały regał</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{row.location}</TableCell>
      <TableCell className="text-sm">{row.warehouse}</TableCell>
      <TableCell className="text-sm">
        {row.scope === "RACK" ? "Regał" : "Asortyment"}
      </TableCell>
      <TableCell className="font-mono text-sm tabular-nums">
        {row.targetRange}
      </TableCell>
      <TableCell className="font-mono font-semibold text-sm tabular-nums">
        {row.recordedTemp}
      </TableCell>
      <TableCell className="font-mono text-sm tabular-nums">
        ±{row.deviation}°C
      </TableCell>
      <TableCell>
        <Badge variant={severity.variant}>{severity.label}</Badge>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {formatDateTime(row.recordedAt)}
      </TableCell>
    </TableRow>
  )
}

export function TemperatureReportCard() {
  const [format, setFormat] = useState<ReportFormat>("xlsx")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("severity")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "recordedAt" ? "desc" : "asc")
    }
  }

  const filtered = useMemo(() => {
    let result = [...TEMPERATURE_REPORT]

    if (search.trim()) {
      const normalizedSearch = search.toLowerCase()
      result = result.filter(
        (row) =>
          row.location.toLowerCase().includes(normalizedSearch) ||
          row.warehouse.toLowerCase().includes(normalizedSearch) ||
          (row.item?.toLowerCase().includes(normalizedSearch) ?? false)
      )
    }

    result.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1
      if (sortField === "deviation") {
        return multiplier * (a.deviation - b.deviation)
      }
      if (sortField === "recordedAt") {
        return multiplier * a.recordedAt.localeCompare(b.recordedAt)
      }
      return (
        multiplier * (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      )
    })

    return result
  }, [search, sortField, sortDirection])

  const stats = useMemo(() => {
    const criticalCount = TEMPERATURE_REPORT.filter(
      (r) => r.severity === "CRITICAL"
    ).length
    const warningCount = TEMPERATURE_REPORT.filter(
      (r) => r.severity === "WARNING"
    ).length
    const maxDeviation = Math.max(...TEMPERATURE_REPORT.map((r) => r.deviation))
    return { criticalCount, warningCount, maxDeviation }
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
        filename: `odchylenia_temperatur_${
          new Date().toISOString().split("T")[0]
        }`,
        format: exportFormat,
        data: filtered,
        columns: [
          {
            header: "Produkt",
            key: (row: TemperatureReportRow) => row.item ?? "Cały regał",
          },
          { header: "Lokalizacja", key: "location" },
          { header: "Magazyn", key: "warehouse" },
          {
            header: "Typ",
            key: (row: TemperatureReportRow) =>
              row.scope === "RACK" ? "Regał" : "Asortyment",
          },
          { header: "Zakres docelowy", key: "targetRange" },
          { header: "Zapisana temp.", key: "recordedTemp" },
          {
            header: "Odchylenie",
            key: (row: TemperatureReportRow) => `±${row.deviation}°C`,
          },
          {
            header: "Status",
            key: (row: TemperatureReportRow) =>
              getSeverityConfig(row.severity).label,
          },
          {
            header: "Data i godzina",
            key: (row: TemperatureReportRow) => formatDateTime(row.recordedAt),
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
                className="size-5 text-orange-500"
                icon={ThermometerIcon}
              />
              Raport przekroczeń temperatur
            </CardTitle>
            <CardDescription>
              Naruszenia zakresów temperatur dla regałów i asortymentu z datą,
              godziną i poziomem krytyczności.
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
            <Button onClick={handleExport}>
              <HugeiconsIcon className="mr-2 size-4" icon={FileDownloadIcon} />
              Pobierz raport
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="border-b bg-muted/30 p-4">
        <SearchInput
          aria-label="Szukaj lokalizacji lub asortymentu"
          onChange={setSearch}
          placeholder="Szukaj po lokalizacji, magazynie, asortymencie..."
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
                  <TableHead>Produkt</TableHead>
                  <TableHead>Regał</TableHead>
                  <TableHead>Magazyn</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Zakres docelowy</TableHead>
                  <SortableTableHead
                    active={sortField === "deviation"}
                    direction={sortDirection}
                    onSort={() => handleSort("deviation")}
                  >
                    Odczyt
                  </SortableTableHead>
                  <TableHead>Odchylenie</TableHead>
                  <SortableTableHead
                    active={sortField === "severity"}
                    direction={sortDirection}
                    onSort={() => handleSort("severity")}
                  >
                    Poziom
                  </SortableTableHead>
                  <SortableTableHead
                    active={sortField === "recordedAt"}
                    direction={sortDirection}
                    onSort={() => handleSort("recordedAt")}
                  >
                    Data i godzina
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TemperatureRow key={row.id} row={row} />
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
            Ostatnia aktualizacja: 10.02.2026, 08:55
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Krytyczne</Badge>
            {stats.criticalCount} naruszeń
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Ostrzeżenia</Badge>
            {stats.warningCount} naruszeń
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Razem</Badge>
            {TEMPERATURE_REPORT.length} odchyleń • maks. ±{stats.maxDeviation}
            °C
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
