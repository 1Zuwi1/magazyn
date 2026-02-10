"use client"

import { useRef } from "react"
import { useElementSize } from "@/hooks/use-element-size"
import { translateMessage } from "@/i18n/translate-message"
import type { RackAssortment } from "@/lib/schemas"
import Virtualized from "./components/virtualized"

interface RackItemsTableProps {
  items: RackAssortment[]
}

const ROW_HEIGHT = 64

export function RackItemsTable({ items }: RackItemsTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { elementWidth: containerWidth, elementHeight: containerHeight } =
    useElementSize(containerRef)

  const handleView = (_itemId: number) => {
    // TODO: implement view
  }

  const handleEdit = (_itemId: number) => {
    // TODO: implement edit
  }

  const handleDelete = (_itemId: number) => {
    // TODO: implement delete
  }

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          {translateMessage("generated.m0486")}
        </p>
      </div>
    )
  }

  return (
    <div
      className="h-[90vw] max-h-150 w-full flex-1 rounded-lg border"
      ref={containerRef}
    >
      <Virtualized
        containerHeight={containerHeight}
        containerWidth={containerWidth}
        items={items}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onView={handleView}
        rowHeight={ROW_HEIGHT}
      />
    </div>
  )
}
