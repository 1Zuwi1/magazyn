"use client"

import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    <>
      <ScrollArea className="w-full rounded-md border">
        <div className="mx-auto w-max min-w-full">
          <Table className="w-max">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    className="whitespace-nowrap px-4 py-3 text-center font-semibold"
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
                        className="whitespace-nowrap px-4 py-2 text-center"
                        key={col.key}
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
      </ScrollArea>

      <p className="text-center text-muted-foreground text-sm">
        {hasMoreRows
          ? `Wyświetlono ${MAX_PREVIEW_ROWS} z ${rows.length} wierszy`
          : `${rows.length} ${rows.length === 1 ? "wiersz" : "wierszy"}`}
      </p>
    </>
  )
}
