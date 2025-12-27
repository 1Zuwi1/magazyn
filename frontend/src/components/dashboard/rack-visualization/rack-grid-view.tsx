"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CubeIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { Item } from "../types"

interface RackGridViewProps {
  rows: number
  cols: number
  items: (Item | null)[]
  currentRackIndex?: number
  totalRacks?: number
  onPreviousRack?: () => void
  onNextRack?: () => void
}

// Helper function to convert index to coordinate (R01-P01, R02-P03, etc.)
function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLabel = `R${String(row + 1).padStart(2, "0")}`
  const colLabel = `P${String(col + 1).padStart(2, "0")}`
  return `${rowLabel}-${colLabel}`
}

const CELL_GAP = 12
const VIRTUALIZATION_THRESHOLD = 10
const VIRTUALIZATION_PADDING = 16
const BASE_CELL_SIZE = 120
export function RackGridView({
  rows,
  cols,
  items,
  currentRackIndex = 0,
  totalRacks = 1,
  onPreviousRack,
  onNextRack,
}: RackGridViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const shouldVirtualize =
    rows > VIRTUALIZATION_THRESHOLD || cols > VIRTUALIZATION_THRESHOLD
  const totalSlots = rows * cols

  const showNavigation = totalRacks > 1 && (onPreviousRack || onNextRack)

  const isMobile = useIsMobile()
  const cellSize = isMobile ? 50 : BASE_CELL_SIZE

  // Always call hooks at the top level
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

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const totalWidth = cols * cellSize + (cols - 1) * CELL_GAP
  const totalHeight = rows * cellSize + (rows - 1) * CELL_GAP

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

  return (
    <div className="flex h-full w-full flex-col gap-4 sm:gap-6">
      {/* Grid Visualization with Side Navigation */}
      <div className="flex h-full w-full items-center gap-2 sm:gap-4">
        {/* Left Navigation Arrow */}
        {showNavigation && onPreviousRack && (
          <button
            className={buttonVariants({
              variant: "outline",
              size: "icon",
              className: "size-8 shrink-0 rounded-full sm:size-10",
            })}
            onClick={onPreviousRack}
            type="button"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </button>
        )}

        {/* Grid */}
        <div
          className="h-full max-h-150 w-full flex-1 rounded-lg border"
          ref={containerRef}
        >
          {shouldVirtualize ? (
            // Virtualized Grid for large racks
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
                    {columnVirtualizer
                      .getVirtualItems()
                      .map((virtualColumn) => {
                        const index =
                          virtualRow.index * cols + virtualColumn.index
                        const item = items[index]
                        const isEmpty = !item
                        const coordinate = getSlotCoordinate(index, cols)

                        return (
                          <Element
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

                        // return (
                        //   <div
                        //     className="group absolute aspect-square overflow-hidden rounded-lg transition-all hover:shadow-md [&:hover>div]:scale-115"
                        //     key={virtualColumn.key}
                        //     style={{
                        //       top: 0,
                        //       left: 0,
                        //       width: `${virtualColumn.size - CELL_GAP}px`,
                        //       height: `${virtualRow.size - CELL_GAP}px`,
                        //       transform: `translateX(${virtualColumn.start}px)`,
                        //     }}
                        //   >
                        //     <Element
                        //       coordinate={coordinate}
                        //       isEmpty={isEmpty}
                        //       item={item}
                        //     />
                        //     {/* Slot coordinate overlay for all slots */}
                        //     <div className="absolute bottom-0.5 left-0.5 flex size-4 items-center justify-center rounded bg-black/50 font-semibold text-[8px] text-white sm:size-5 sm:text-[10px]">
                        //       {coordinate}
                        //     </div>
                        //   </div>
                        // )
                      })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Regular CSS Grid for small racks
            <div
              className="p-2 sm:p-4"
              style={{
                width: `${containerWidth}px`,
                maxHeight: `${containerHeight}px`,
                overflow: "auto",
                position: "relative",
              }}
            >
              <div
                className="grid gap-2 sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: totalSlots }).map((_, index) => {
                  const item = items[index]
                  const isEmpty = !item
                  const coordinate = getSlotCoordinate(index, cols)

                  return (
                    <Element
                      coordinate={coordinate}
                      isEmpty={isEmpty}
                      item={item}
                      key={index}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation Arrow */}
        {showNavigation && onNextRack && (
          <button
            className={buttonVariants({
              variant: "outline",
              size: "icon",
              className: "size-8 shrink-0 rounded-full sm:size-10",
            })}
            onClick={onNextRack}
            type="button"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </button>
        )}
      </div>

      {/* Rack Indicator */}
      {totalRacks > 1 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Regał:
          </span>
          <span className="font-semibold text-xs sm:text-sm">
            {currentRackIndex + 1} / {totalRacks}
          </span>
        </div>
      )}
    </div>
  )
}

interface ElementProps extends React.HTMLAttributes<HTMLDivElement> {
  isEmpty: boolean
  item: Item | null
  coordinate: string
}

function Element({
  isEmpty,
  item,
  coordinate,
  className,
  ...props
}: ElementProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-md",
        {
          "outline-2 outline-red-500": item?.isDangerous,
        },
        className
      )}
      {...props}
    >
      {!item || isEmpty ? (
        // Empty slot
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 text-muted-foreground">
          <span className="font-semibold text-xs sm:text-sm md:text-lg">
            {coordinate}
          </span>
        </div>
      ) : (
        // Occupied slot
        <div className="relative flex h-full items-center justify-center bg-secondary">
          {item.imageUrl ? (
            <Image
              alt={item.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 60px, 80px"
              src={item.imageUrl}
            />
          ) : (
            // Fallback icon when no image
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <HugeiconsIcon
                className="size-8 text-muted-foreground"
                icon={CubeIcon}
              />
            </div>
          )}
          {/* Danger indicator */}
          {item.isDangerous && (
            <div className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive">
              <div className="size-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      )}
      {/* Slot coordinate overlay for all slots */}
      <div className="absolute bottom-0.5 left-0.5 flex h-fit w-fit items-center justify-center rounded bg-black/50 p-0.5 font-semibold text-[8px] text-white sm:text-[10px]">
        {coordinate}
      </div>
    </div>
  )
}
