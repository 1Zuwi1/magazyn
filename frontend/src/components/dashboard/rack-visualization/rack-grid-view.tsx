"use client"

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import type { Item } from "../types"
import Normal from "./components/normal"
import Virtualized from "./components/virtualized"

interface RackGridViewProps {
  rows: number
  cols: number
  items: Item[]
  currentRackIndex?: number
  totalRacks?: number
  onPreviousRack?: () => void
  onNextRack?: () => void
}

const VIRTUALIZATION_THRESHOLD_COLS = 7
const VIRTUALIZATION_THRESHOLD_ROWS = 4
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
    rows > VIRTUALIZATION_THRESHOLD_ROWS || cols > VIRTUALIZATION_THRESHOLD_COLS

  const showNavigation = totalRacks > 1 && (onPreviousRack || onNextRack)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

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
            <Virtualized
              cols={cols}
              containerHeight={containerHeight}
              containerWidth={containerWidth}
              items={items}
              parentRef={parentRef}
              rows={rows}
            />
          ) : (
            // Regular CSS Grid for small racks
            <Normal
              cols={cols}
              containerHeight={containerHeight}
              containerWidth={containerWidth}
              items={items}
              rows={rows}
            />
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
