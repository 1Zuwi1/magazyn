"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { VIRTUALIZATION_THRESHOLDS } from "@/config/constants"
import type { Item } from "../types"
import Normal from "./components/normal"
import Virtualized from "./components/virtualized"

interface RackItemsTableProps {
  items: Item[]
}

const VIRTUALIZATION_THRESHOLD = VIRTUALIZATION_THRESHOLDS.TABLE
const ROW_HEIGHT = 64

export function RackItemsTable({ items }: RackItemsTableProps) {
  const t = useTranslations("rackItemsTable")
  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const handleView = (itemId: string) => {
    console.log("handleView", itemId)
  }

  const handleEdit = (itemId: string) => {
    console.log("handleEdit", itemId)
  }

  const handleDelete = (itemId: string) => {
    console.log("handleDelete", itemId)
  }

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
        setContainerHeight(containerRef.current.offsetHeight)
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    )
  }

  return (
    <div
      className="h-[90vw] max-h-150 w-full flex-1 rounded-lg border"
      ref={containerRef}
    >
      {shouldVirtualize ? (
        <Virtualized
          containerHeight={containerHeight}
          containerWidth={containerWidth}
          items={items}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={handleView}
          rowHeight={ROW_HEIGHT}
        />
      ) : (
        <Normal
          containerHeight={containerHeight}
          containerWidth={containerWidth}
          items={items}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={handleView}
          rowHeight={ROW_HEIGHT}
        />
      )}
    </div>
  )
}
