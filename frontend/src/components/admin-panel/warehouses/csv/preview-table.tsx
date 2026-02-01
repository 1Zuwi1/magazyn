"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
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
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "w-full overflow-x-auto",
          "rounded-md border",
          isMobile && "pb-2"
        )}
      >
        <Table className="min-w-max">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  className="whitespace-nowrap px-4 py-3 font-semibold"
                  key={col.key}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell
                      className="whitespace-nowrap px-4 py-3"
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
                  className="h-24 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  Brak danych do wyświetlenia
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-center text-muted-foreground text-sm">
        {hasMoreRows
          ? `Wyświetlono ${MAX_PREVIEW_ROWS} z ${rows.length} wierszy`
          : `${rows.length} ${rows.length === 1 ? "wiersz" : "wierszy"}`}
      </div>
    </div>
  )
}
