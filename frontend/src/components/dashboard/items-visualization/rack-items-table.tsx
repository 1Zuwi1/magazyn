"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody } from "@/components/ui/table"
import type { Item } from "../types"
import { NormalRow } from "./components/normal-row"
import { RackItemsTableHeader } from "./components/table-header"
import { VirtualizedRow } from "./components/virtualized-row"

interface RackItemsTableProps {
  items: NonNullable<Item>[]
}

function isExpired(date: Date): boolean {
  return date < new Date()
}

const VIRTUALIZATION_THRESHOLD = 50
const ROW_HEIGHT = 64

export function RackItemsTable({ items }: RackItemsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    enabled: shouldVirtualize,
  })

  const handleView = (itemId: string) => {
    console.log("View item:", itemId)
  }

  const handleEdit = (itemId: string) => {
    console.log("Edit item:", itemId)
  }

  const handleDelete = (itemId: string) => {
    console.log("Delete item:", itemId)
  }

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Brak przedmiotów w tym regale</p>
      </div>
    )
  }

  if (!shouldVirtualize) {
    return (
      <ScrollArea className="h-100 rounded-md border">
        <Table>
          <RackItemsTableHeader />
          <TableBody>
            {items.map((item) => {
              const expired = isExpired(item.expiryDate)
              return (
                <NormalRow
                  expired={expired}
                  item={item}
                  key={item.id}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    )
  }

  const virtualItems = rowVirtualizer.getVirtualItems()
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <RackItemsTableHeader />
        </Table>
      </div>
      <div className="h-100 overflow-auto" ref={parentRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <Table>
            <TableBody>
              {virtualItems.map((virtualRow) => {
                const item = items[virtualRow.index]
                const expired = isExpired(item.expiryDate)
                return (
                  <VirtualizedRow
                    expired={expired}
                    item={item}
                    key={item.id}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onView={handleView}
                    virtualRow={virtualRow}
                  />
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
