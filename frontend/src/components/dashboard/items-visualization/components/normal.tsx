"use client"

import { memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody } from "@/components/ui/table"
import type { Assortment } from "@/lib/schemas"
import { NormalRow } from "./normal-row"
import { RackItemsTableHeader } from "./table-header"

interface NormalProps {
  items: Assortment[]
  rowHeight: number
  containerWidth: number
  containerHeight: number
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

const Normal = ({
  items,
  rowHeight,
  containerWidth,
  containerHeight,
  onView,
  onEdit,
  onDelete,
}: NormalProps) => {
  const containerStyle = {
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    position: "relative",
  } as const

  return (
    <ScrollArea className="min-h-0 w-full flex-1 pr-2" style={containerStyle}>
      <Table>
        <RackItemsTableHeader />
        <TableBody>
          {items.map((assortment) => {
            return (
              <NormalRow
                assortment={assortment}
                key={assortment.id}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                rowHeight={rowHeight}
              />
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

Normal.displayName = "Normal"
export default memo(Normal)
