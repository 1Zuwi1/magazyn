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
import { INVENTORY_REPORT, REPORT_FORMATS } from "../lib/data"
import type { InventoryReportRow, ReportFormat } from "../lib/types"

const getInventoryStatusBadge = (status: InventoryReportRow["status"]) => {
  if (status === "LOW") {
    return { label: "Niski stan – uzupełnij", variant: "warning" as const }
  }
  if (status === "OVERSTOCK") {
    return { label: "Nadmiar – zredukuj", variant: "destructive" as const }
  }
  return { label: "W normie", variant: "success" as const }
}

export function InventoryReportCard() {
  const [format, setFormat] = useState<ReportFormat>("xlsx")
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
    return {
      totalQuantity,
      lowCount,
      overstockCount,
    }
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
              Zestawienie aktualnych stanów magazynowych według lokalizacji i
              SKU.
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
      <CardContent className="pt-6">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asortyment</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Magazyn</TableHead>
                <TableHead>Regał</TableHead>
                <TableHead>Ilość</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVENTORY_REPORT.map((row) => {
                const badge = getInventoryStatusBadge(row.status)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.item}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.sku}
                    </TableCell>
                    <TableCell>{row.warehouse}</TableCell>
                    <TableCell>{row.rack}</TableCell>
                    <TableCell className="font-semibold">
                      {row.quantity} {row.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
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
            {summary.totalQuantity} szt.
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
