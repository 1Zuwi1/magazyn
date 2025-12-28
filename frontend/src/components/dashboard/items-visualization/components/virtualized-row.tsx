"use client"

import type { VirtualItem } from "@tanstack/react-virtual"
import { TableRow } from "@/components/ui/table"
import type { Item } from "../../types"
import { TableRowContent } from "./table-row-content"

interface VirtualizedRowProps {
  item: NonNullable<Item>
  expired: boolean
  virtualRow: VirtualItem
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function VirtualizedRow({
  item,
  expired,
  virtualRow,
  onView,
  onEdit,
  onDelete,
}: VirtualizedRowProps) {
  return (
    <TableRow
      key={item.id}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <TableRowContent
        expired={expired}
        item={item}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
      />
    </TableRow>
  )
}
