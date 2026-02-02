"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  GridViewIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RackItemsDialog } from "../items-visualization/rack-items-dialog"
import type { ItemSlot, Rack } from "../types"
import Virtualized from "./components/virtualized"

interface RackGridViewProps {
  rows: number
  cols: number
  items: ItemSlot[]
  currentRackIndex?: number
  totalRacks?: number
  onPreviousRack: () => void
  onNextRack: () => void
  onSetRack: (index: number) => void
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

export function RackGridView({
  rows,
  cols,
  items,
  currentRackIndex = 0,
  totalRacks = 1,
  onPreviousRack,
  onNextRack,
  onSetRack,
  rack,
}: RackGridViewProps) {
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const showNavigation = totalRacks > 1 && (onPreviousRack || onNextRack)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Calculate occupancy stats
  const totalSlots = rows * cols
  const occupiedSlots = items.filter((item) => item !== null).length
  const occupancyPercentage = Math.round((occupiedSlots / totalSlots) * 100)

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
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
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
          className="relative h-full max-h-125 min-h-72 w-full min-w-0 flex-1 overflow-hidden rounded-xl border bg-linear-to-br from-background to-muted/20 sm:min-h-96"
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
            parentRef={parentRef}
            rows={rows}
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

      {/* Footer Bar - Rack Indicator */}
      {totalRacks > 1 && (
        <div className="flex items-center justify-center gap-3 border-t bg-muted/20 px-4 py-3">
          {/* Rack dots indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalRacks }).map((_, index) => (
              <button
                aria-label={`Regał ${index + 1}`}
                className={`size-2 rounded-full transition-all ${
                  index === currentRackIndex
                    ? "scale-125 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                key={index}
                onClick={() => {
                  // Navigate to specific rack
                  onSetRack(index)
                }}
                type="button"
              />
            ))}
          </div>
          <span className="font-mono text-muted-foreground text-xs">
            Regał{" "}
            <span className="font-semibold text-foreground">
              {currentRackIndex + 1}
            </span>{" "}
            z {totalRacks}
          </span>
        </div>
      )}

      <RackItemsDialog
        onOpenChange={setIsItemsDialogOpen}
        open={isItemsDialogOpen}
        rack={rack || null}
      />
    </div>
  )
}
