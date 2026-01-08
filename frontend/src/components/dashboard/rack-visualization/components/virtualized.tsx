import { useVirtualizer } from "@tanstack/react-virtual"
import { memo, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ItemSlot } from "../../types"
import { getSlotCoordinate } from "../../utils/helpers"
import RackElement from "./rack-element"

const CELL_GAP = 12
const VIRTUALIZATION_PADDING = 16
const BASE_CELL_SIZE = 120
const MOBILE_CELL_SIZE = 50

const Virtualized = ({
  rows,
  cols,
  parentRef,
  containerWidth,
  containerHeight,
  items,
}: {
  rows: number
  cols: number
  parentRef: React.RefObject<HTMLDivElement | null>
  containerWidth: number
  containerHeight: number
  items: ItemSlot[]
}) => {
  const isMobile = useIsMobile()
  const minCellSize = isMobile ? MOBILE_CELL_SIZE : BASE_CELL_SIZE
  const availableWidth = Math.max(
    containerWidth - VIRTUALIZATION_PADDING * 2,
    0
  )
  const fittedCellSize =
    cols > 0
      ? Math.max((availableWidth - (cols - 1) * CELL_GAP) / cols, 0)
      : minCellSize
  const cellSize = Math.max(minCellSize, fittedCellSize)
  const totalWidth = cols * cellSize + (cols - 1) * CELL_GAP
  const totalHeight = rows * cellSize + (rows - 1) * CELL_GAP

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cellSize + CELL_GAP,
    overscan: 3,
    paddingStart: VIRTUALIZATION_PADDING,
    paddingEnd: VIRTUALIZATION_PADDING,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: cols,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cellSize + CELL_GAP,
    overscan: 3,
    paddingStart: VIRTUALIZATION_PADDING,
    paddingEnd: VIRTUALIZATION_PADDING,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: rowVirtualizer and columnVirtualizer are not stable so we use rows, cols and cellSize as dependencies
  useEffect(() => {
    rowVirtualizer.measure()
    columnVirtualizer.measure()
  }, [rows, cols, cellSize])

  return (
    <div
      ref={parentRef}
      style={{
        width: `${containerWidth}px`,
        maxHeight: `${containerHeight}px`,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          width: `${totalWidth}px`,
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const index = virtualRow.index * cols + virtualColumn.index
              const item = items[index]
              const isEmpty = !item
              const coordinate = getSlotCoordinate(index, cols)

              return (
                <RackElement
                  className="absolute origin-center"
                  coordinate={coordinate}
                  isEmpty={isEmpty}
                  item={item}
                  key={virtualColumn.key}
                  style={{
                    top: 0,
                    left: 0,
                    width: `${virtualColumn.size - CELL_GAP}px`,
                    height: `${virtualRow.size - CELL_GAP}px`,
                    translate: `${virtualColumn.start}px`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

Virtualized.displayName = "Virtualized"
export default memo(Virtualized)
