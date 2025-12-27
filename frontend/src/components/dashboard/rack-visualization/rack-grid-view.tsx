"use client"

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CubeIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { buttonVariants } from "@/components/ui/button"
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

// Helper function to convert index to coordinate (A1, B2, etc.)
function getSlotCoordinate(index: number, cols: number): string {
  const row = Math.floor(index / cols)
  const col = index % cols
  const rowLetter = String.fromCharCode(65 + row) // 65 is 'A' in ASCII
  return `${rowLetter}${col + 1}`
}

export function RackGridView({
  rows,
  cols,
  items,
  currentRackIndex = 0,
  totalRacks = 1,
  onPreviousRack,
  onNextRack,
}: RackGridViewProps) {
  const totalSlots = rows * cols

  const showNavigation = totalRacks > 1 && (onPreviousRack || onNextRack)

  return (
    <div className="flex flex-col gap-6">
      {/* Grid Visualization with Side Navigation */}
      <div className="flex items-center gap-4">
        {/* Left Navigation Arrow */}
        {showNavigation && onPreviousRack && (
          <button
            className={buttonVariants({
              variant: "outline",
              size: "icon",
              className: "shrink-0 rounded-full",
            })}
            onClick={onPreviousRack}
            type="button"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </button>
        )}

        {/* Grid */}
        <div className="flex-1">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: totalSlots }).map((_, index) => {
              const item = items[index]
              const isEmpty = !item
              const coordinate = getSlotCoordinate(index, cols)

              return (
                <div
                  className="group relative aspect-square overflow-hidden rounded-lg transition-all hover:scale-105 hover:shadow-md"
                  key={index}
                >
                  {isEmpty ? (
                    // Empty slot
                    <div className="flex h-full flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                      <span className="font-semibold text-lg">
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
                  <div className="absolute bottom-1 left-1 flex size-5 items-center justify-center rounded bg-black/50 font-semibold text-[10px] text-white">
                    {coordinate}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Navigation Arrow */}
        {showNavigation && onNextRack && (
          <button
            className={buttonVariants({
              variant: "outline",
              size: "icon",
              className: "shrink-0 rounded-full",
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
          <span className="text-muted-foreground text-sm">Regał:</span>
          <span className="font-semibold text-sm">
            {currentRackIndex + 1} / {totalRacks}
          </span>
        </div>
      )}
    </div>
  )
}
