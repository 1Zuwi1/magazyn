"use client"

import { memo, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody } from "@/components/ui/table"
import type { Item } from "../../types"
import { NormalRow } from "./normal-row"
import { RackItemsTableHeader } from "./table-header"

interface NormalProps {
  items: Item[]
  rowHeight: number
  containerWidth: number
  containerHeight: number
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
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
  const referenceDate = useMemo(() => new Date(), [])
  const containerStyle = {
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    overflow: "auto",
    position: "relative",
  } as const

  return (
    <ScrollArea className="min-h-0 w-full flex-1 pr-2" style={containerStyle}>
      <Table>
        <RackItemsTableHeader />
        <TableBody>
          {items.map((item) => {
            const expired = item.expiryDate < referenceDate
            return (
              <NormalRow
                expired={expired}
                item={item}
                key={item.id}
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
