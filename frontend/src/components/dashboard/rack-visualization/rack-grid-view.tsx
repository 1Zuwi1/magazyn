"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  GridViewIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Rack } from "@/lib/schemas"
import { RackItemsDialog } from "../items-visualization/rack-items-dialog"
import type { ItemSlot, SlotCoordinates } from "../types"
import Virtualized from "./components/virtualized"

const VISIBLE_PAGE_COUNT = 3

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= VISIBLE_PAGE_COUNT) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }
  const halfWindow = Math.floor(VISIBLE_PAGE_COUNT / 2)
  let start = currentPage - halfWindow
  if (start < 0) {
    start = 0
  }
  let end = start + VISIBLE_PAGE_COUNT - 1
  if (end >= totalPages) {
    end = totalPages - 1
    start = end - VISIBLE_PAGE_COUNT + 1
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

interface RackGridViewProps {
  rows: number
  cols: number
  items: ItemSlot[]
  currentPage?: number
  totalPages?: number
  onPreviousRack: () => void
  onNextRack: () => void
  onSetPage: (page: number) => void
  onActivateSlot?: (coordinates: SlotCoordinates) => void
  onSelectSlot?: (coordinates: SlotCoordinates) => void
  selectedSlotCoordinates?: SlotCoordinates | null
  rack?: Rack
}

function getOccupancyBadgeVariant(
  occupancy: number
): "secondary" | "warning" | "destructive" {
  if (occupancy >= 90) {
    return "destructive"
  }
  if (occupancy >= 75) {
    return "warning"
  }
  return "secondary"
}

const ARROW_MOVES = {
  ArrowRight: { row: 0, col: 1 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowDown: { row: 1, col: 0 },
  ArrowUp: { row: -1, col: 0 },
} as const

type ArrowKey = keyof typeof ARROW_MOVES

const isArrowKey = (value: string): value is ArrowKey => value in ARROW_MOVES

const clampValue = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const getNextCoordinates = (
  coordinates: SlotCoordinates,
  rows: number,
  cols: number,
  key: ArrowKey
): SlotCoordinates => {
  const move = ARROW_MOVES[key]
  const nextY = clampValue(coordinates.y + move.row, 0, rows - 1)
  const nextX = clampValue(coordinates.x + move.col, 0, cols - 1)
  return { x: nextX, y: nextY }
}

export function RackGridView({
  rows,
  cols,
  items,
  currentPage = 0,
  totalPages = 1,
  onPreviousRack,
  onNextRack,
  onSetPage,
  onActivateSlot,
  onSelectSlot,
  selectedSlotCoordinates,
  rack,
}: RackGridViewProps) {
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const showNavigation = totalPages > 1 && (onPreviousRack || onNextRack)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Calculate occupancy stats
  const totalSlots = rows * cols
  const occupiedSlots = items.filter((item) => item !== null).length
  const occupancyPercentage = Math.round((occupiedSlots / totalSlots) * 100)

  const handleSlotKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    coordinates: SlotCoordinates
  ) => {
    if (rows <= 0 || cols <= 0) {
      return
    }

    if (event.key === "Enter") {
      onActivateSlot?.({
        x: coordinates.x - 1,
        y: coordinates.y - 1,
      })
      event.preventDefault()
      return
    }

    if (!(isArrowKey(event.key) && onSelectSlot)) {
      return
    }

    event.preventDefault()
    const nextCoordinates = getNextCoordinates(
      coordinates,
      rows,
      cols,
      event.key
    )
    if (
      nextCoordinates.x !== coordinates.x ||
      nextCoordinates.y !== coordinates.y
    ) {
      onSelectSlot({
        x: nextCoordinates.x - 1,
        y: nextCoordinates.y - 1,
      })
    }
  }

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const updateSize = (width: number, height: number) => {
      setContainerWidth(width)
      setContainerHeight(height)
    }

    updateSize(element.clientWidth, element.clientHeight)

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => {
        updateSize(element.clientWidth, element.clientHeight)
      }

      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateSize(entry.contentRect.width, entry.contentRect.height)
      }
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon
              className="size-4.5 text-primary"
              icon={GridViewIcon}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Widok siatki</h3>
            <p className="text-muted-foreground text-xs">
              {rows} × {cols} = {totalSlots} miejsc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className="font-mono"
            variant={getOccupancyBadgeVariant(occupancyPercentage)}
          >
            {occupancyPercentage}% zajęte
          </Badge>
          <Button
            className="gap-1.5"
            onClick={() => setIsItemsDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="size-3.5" icon={ViewIcon} />
            <span className="hidden sm:inline">Lista przedmiotów</span>
          </Button>
        </div>
      </div>

      {/* Grid Visualization with Side Navigation */}
      <div className="relative flex flex-1 items-center gap-2 p-3 sm:gap-4 sm:p-4">
        {/* Left Navigation Arrow */}
        {showNavigation && onPreviousRack && (
          <Button
            className="z-10 size-10 shrink-0 rounded-xl shadow-md"
            onClick={onPreviousRack}
            size="icon"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon className="size-5" icon={ArrowLeft01Icon} />
          </Button>
        )}

        {/* Grid Container */}
        <div
          className="relative h-full max-h-125 min-h-72 w-full min-w-0 flex-1 overflow-hidden rounded-xl border bg-linear-to-br from-background to-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-h-96"
          ref={containerRef}
        >
          {/* Decorative corner accents */}
          <div className="pointer-events-none absolute top-0 left-0 size-16 rounded-br-3xl border-primary/20 border-r border-b opacity-50" />
          <div className="pointer-events-none absolute right-0 bottom-0 size-16 rounded-tl-3xl border-primary/20 border-t border-l opacity-50" />

          <Virtualized
            cols={cols}
            containerHeight={containerHeight}
            containerWidth={containerWidth}
            items={items}
            onSelectSlot={onSelectSlot}
            onSlotKeyDown={handleSlotKeyDown}
            parentRef={parentRef}
            rows={rows}
            selectedSlotCoordinates={selectedSlotCoordinates}
          />
        </div>

        {/* Right Navigation Arrow */}
        {showNavigation && onNextRack && (
          <Button
            className="z-10 size-10 shrink-0 rounded-xl shadow-md"
            onClick={onNextRack}
            size="icon"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon className="size-5" icon={ArrowRight01Icon} />
          </Button>
        )}
      </div>

      {/* Footer Bar - Rack Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t bg-muted/20 px-4 py-3">
          {/* Page number buttons */}
          <div className="flex items-center gap-1" role="tablist">
            {getVisiblePages(currentPage, totalPages).map((page) => (
              <button
                aria-label={`Regał ${page + 1}`}
                aria-selected={page === currentPage}
                className={`flex size-7 items-center justify-center rounded-md font-mono text-xs transition-all ${
                  page === currentPage
                    ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                key={page}
                onClick={() => onSetPage(page)}
                role="tab"
                type="button"
              >
                {page + 1}
              </button>
            ))}
          </div>
          <span className="font-mono text-muted-foreground text-xs">
            Regał{" "}
            <span className="font-semibold text-foreground">
              {currentPage + 1}
            </span>{" "}
            z {totalPages}
          </span>
        </div>
      )}

      <RackItemsDialog
        onOpenChange={setIsItemsDialogOpen}
        open={isItemsDialogOpen}
        rack={rack || null}
      />
    </>
  )
}
