"use client"

import {
  Calendar03Icon,
  FileDownloadIcon,
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
import {
  EXPIRY_REPORT,
  formatDate,
  getExpiryStatus,
  REPORT_FORMATS,
} from "../lib/data"
import type { ReportFormat } from "../lib/types"

interface ExpiryReportCardProps {
  soonExpiry: number
}

export function ExpiryReportCard({ soonExpiry }: ExpiryReportCardProps) {
  const [format, setFormat] = useState<ReportFormat>("xlsx")

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
      <CardContent className="pt-6">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asortyment</TableHead>
                <TableHead>Partia</TableHead>
                <TableHead>Magazyn</TableHead>
                <TableHead>Regał</TableHead>
                <TableHead>Data ważności</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXPIRY_REPORT.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell>{row.batch}</TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell>{row.rack}</TableCell>
                  <TableCell>{formatDate(row.expiryDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getExpiryStatus(row.daysLeft).variant}>
                        {getExpiryStatus(row.daysLeft).label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {row.daysLeft} dni
                      </span>
                    </div>
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
            Ostatnia aktualizacja: 10.02.2026, 09:40
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Wkrótce</Badge>
            {soonExpiry} pozycji w przedziale 10 dni
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
