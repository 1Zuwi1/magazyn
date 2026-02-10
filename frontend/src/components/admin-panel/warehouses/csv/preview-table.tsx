"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { translateMessage } from "@/i18n/translate-message"
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
  const previewRows = hasMoreRows ? rows.slice(0, MAX_PREVIEW_ROWS) : rows

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className={cn("w-full xl:hidden", hasMoreRows && "max-h-90")}>
        <div className="flex flex-col gap-3">
          {previewRows.length > 0 ? (
            previewRows.map((row, index) => (
              <div className="rounded-md border p-3" key={index}>
                <div className="grid gap-2">
                  {columns.map((col) => {
                    const value = row[normalizeKey(col.key)] || "-"
                    return (
                      <div
                        className="flex items-start justify-between gap-3"
                        key={col.key}
                      >
                        <span className="text-muted-foreground text-xs">
                          {col.label}
                        </span>
                        <span className="text-right text-sm" title={value}>
                          {value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border p-6 text-center text-muted-foreground">
              {translateMessage("generated.admin.warehouses.dataDisplay")}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="hidden w-full rounded-md border xl:block">
        <ScrollArea
          className={cn("w-full overflow-x-auto", hasMoreRows && "max-h-90")}
        >
          <div className="flex flex-col gap-3">
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
                {previewRows.length > 0 ? (
                  previewRows.map((row, i) => (
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
                      {translateMessage(
                        "generated.admin.warehouses.dataDisplay"
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>

      <div className="text-left text-muted-foreground text-sm">
        {hasMoreRows
          ? translateMessage("generated.admin.warehouses.showing", {
              value0: previewRows.length,
              value1: rows.length,
            })
          : rows.length > 0 &&
            translateMessage("generated.admin.warehouses.showing2", {
              value0: rows.length,
            })}
      </div>
    </div>
  )
}
