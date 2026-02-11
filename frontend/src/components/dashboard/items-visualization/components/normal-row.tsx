"use client"

import { memo } from "react"
import { TableRow } from "@/components/ui/table"
import type { RackAssortment } from "@/lib/schemas"
import { TableRowContent } from "./table-row-content"

interface NormalRowProps {
  assortment: RackAssortment
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  rowHeight?: number
}

export const NormalRow = memo(
  ({ assortment, onView, onEdit, onDelete, rowHeight }: NormalRowProps) => {
    const rowStyle = rowHeight ? { height: rowHeight } : undefined

    return (
      <TableRow key={assortment.id} style={rowStyle}>
        <TableRowContent
          assortment={assortment}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      </TableRow>
    )
  }
)

NormalRow.displayName = "NormalRow"
