"use client"

import {
  FileDownloadIcon,
  ThermometerIcon,
  Time02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
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
import { REPORT_FORMATS, TEMPERATURE_REPORT } from "../lib/data"
import type { ReportFormat, TemperatureReportRow } from "../lib/types"

const TEMP_RANGE_REGEX = /([\d.-]+)°C\s*–\s*([\d.-]+)°C/

const getTemperatureDeviation = (row: TemperatureReportRow) => {
  const rangeMatch = row.targetRange.match(TEMP_RANGE_REGEX)
  if (!rangeMatch) {
    return { direction: "Poza normą", variant: "destructive" as const }
  }
  const min = Number.parseFloat(rangeMatch[1])
  const max = Number.parseFloat(rangeMatch[2])
  const temp = Number.parseFloat(row.recordedTemp.replace("°C", ""))

  if (temp > max) {
    return { direction: "↑ powyżej normy", variant: "destructive" as const }
  }
  if (temp < min) {
    return { direction: "↓ poniżej normy", variant: "destructive" as const }
  }
  return { direction: "W normie", variant: "success" as const }
}

export function TemperatureReportCard() {
  const [format, setFormat] = useState<ReportFormat>("xlsx")

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
              Naruszenia zakresów temperatur dla regałów i asortymentu z datą i
              godziną.
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
                <TableHead>Typ i zakres docelowy</TableHead>
                <TableHead>Lokalizacja</TableHead>
                <TableHead>Powiązany asortyment</TableHead>
                <TableHead>Odczyt / Odchylenie</TableHead>
                <TableHead>Data i godzina</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEMPERATURE_REPORT.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={row.scope === "RACK" ? "secondary" : "outline"}
                      >
                        {row.scope === "RACK" ? "Regał" : "Asortyment"}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {row.targetRange}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>
                    {row.item ? (
                      <span className="font-medium text-foreground">
                        {row.item}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Cały regał
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTemperatureDeviation(row).variant}>
                        {row.recordedTemp}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {getTemperatureDeviation(row).direction}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.recordedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <HugeiconsIcon className="size-3.5" icon={Time02Icon} />
            Ostatnia aktualizacja: 10.02.2026, 08:55
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Alert</Badge>2 naruszenia krytyczne w
            ostatnich 24h
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
