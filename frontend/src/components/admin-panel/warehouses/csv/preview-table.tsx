"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MAX_PREVIEW_ROWS } from "./constants"
import type { Column } from "./types"

interface PreviewTableProps {
  columns: Column[]
  rows: Record<string, string>[]
}

export function PreviewTable({ columns, rows }: PreviewTableProps) {
  const displayRows = rows.slice(0, MAX_PREVIEW_ROWS)

  return (
    <ScrollArea className="w-full">
      <div className="min-w-max">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead className="whitespace-nowrap px-4" key={col.key}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell className="whitespace-nowrap px-4" key={col.key}>
                    {row[col.key] ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
