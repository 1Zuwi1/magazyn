"use client"

import { pluralize } from "@/components/dashboard/utils/helpers"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { normalizeKey } from "./utils/csv-utils"
import type { Column } from "./utils/types"

interface PreviewTableProps {
  columns: Column[]
  rows: Record<string, string>[]
}

export function PreviewTable({ columns, rows }: PreviewTableProps) {
  const hasMoreRows = rows.length > MAX_PREVIEW_ROWS
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("w-full rounded-md border", isMobile && "pb-2")}>
        <ScrollArea
          className={cn("w-full overflow-x-auto", hasMoreRows && "max-h-90")}
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
        </ScrollArea>
      </div>

      <div className="text-center text-muted-foreground text-sm">
        {hasMoreRows &&
          `Wyświetlono ${rows.length} ${pluralize(rows.length, "wiersz", "wiersze", "wierszy")}`}
      </div>
    </div>
  )
}
