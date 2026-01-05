"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import { memo, useMemo, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type { Item } from "../../types"
import { NormalRow } from "./normal-row"
import { RackItemsTableHeader } from "./table-header"

const OVERSCAN = 10
const COLUMN_COUNT = 9

interface VirtualizedProps {
  items: Item[]
  rowHeight: number
  containerWidth: number
  containerHeight: number
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const Virtualized = ({
  items,
  rowHeight,
  containerWidth,
  containerHeight,
  onView,
  onEdit,
  onDelete,
}: VirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: OVERSCAN,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - (virtualItems.at(-1)?.end || 0) : 0
  const referenceDate = useMemo(() => new Date(), [])
  const containerStyle = {
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    position: "relative",
  } as const

  return (
    <ScrollArea
      className="min-h-0 w-full flex-1 pr-2"
      ref={parentRef}
      style={containerStyle}
    >
      <Table>
        <RackItemsTableHeader />
        <TableBody>
          {paddingTop > 0 && (
            <TableRow
              aria-hidden="true"
              className="border-0 hover:bg-transparent"
            >
              <TableCell
                className="p-0"
                colSpan={COLUMN_COUNT}
                style={{ height: paddingTop }}
              />
            </TableRow>
          )}
          {virtualItems.map((virtualRow, index) => {
            const item = items[virtualRow.index]
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
          {paddingBottom > 0 && (
            <TableRow
              aria-hidden="true"
              className="border-0 hover:bg-transparent"
            >
              <TableCell
                className="p-0"
                colSpan={COLUMN_COUNT}
                style={{ height: paddingBottom }}
              />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

Virtualized.displayName = "Virtualized"
export default memo(Virtualized)
