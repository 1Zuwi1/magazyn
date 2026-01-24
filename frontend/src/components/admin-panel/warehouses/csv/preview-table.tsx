"use client"

import { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MAX_PREVIEW_ROWS } from "./utils/constants"
import type { Column } from "./utils/types"

interface PreviewTableProps {
  columns: Column[]
  rows: Record<string, string>[]
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "")
}

export function PreviewTable({ columns, rows }: PreviewTableProps) {
  const hasMoreRows = rows.length > MAX_PREVIEW_ROWS

  const normalizedRows = useMemo(() => {
    const displayRows = rows.slice(0, MAX_PREVIEW_ROWS)
    return displayRows.map((row) => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        normalized[normalizeKey(key)] = value
      }
      return normalized
    })
  }, [rows])

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative max-h-80 min-w-0 overflow-auto rounded-md border">
        <Table className="w-full">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  className="min-w-32 whitespace-nowrap border-r px-4 py-3 text-center font-semibold last:border-r-0"
                  key={col.key}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedRows.length > 0 ? (
              normalizedRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell
                      className="min-w-32 max-w-56 truncate whitespace-nowrap border-r px-4 py-2 text-center last:border-r-0"
                      key={col.key}
                      title={row[normalizeKey(col.key)] || "-"}
                    >
                      {row[normalizeKey(col.key)] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="py-8 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  Brak danych do wyświetlenia
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-muted-foreground text-sm">
        {hasMoreRows
          ? `Wyświetlono ${MAX_PREVIEW_ROWS} z ${rows.length} wierszy`
          : `${rows.length} ${rows.length === 1 ? "wiersz" : "wierszy"}`}
      </p>
    </div>
  )
}
