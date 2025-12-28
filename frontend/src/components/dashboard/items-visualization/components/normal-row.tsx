"use client"

import { TableRow } from "@/components/ui/table"
import type { Item } from "../../types"
import { TableRowContent } from "./table-row-content"

interface NormalRowProps {
  item: NonNullable<Item>
  expired: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function NormalRow({
  item,
  expired,
  onView,
  onEdit,
  onDelete,
}: NormalRowProps) {
  return (
    <TableRow key={item.id}>
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
