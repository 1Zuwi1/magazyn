"use client"

import { memo } from "react"
import { TableRow } from "@/components/ui/table"
import type { Item } from "../../types"
import { TableRowContent } from "./table-row-content"

interface NormalRowProps {
  item: Item
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  rowHeight?: number
}

export const NormalRow = memo(
  ({ item, onView, onEdit, onDelete, rowHeight }: NormalRowProps) => {
    const rowStyle = rowHeight ? { height: rowHeight } : undefined

    return (
      <TableRow key={item.id} style={rowStyle}>
        <TableRowContent
          item={item}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      </TableRow>
    )
  }
)

NormalRow.displayName = "NormalRow"
