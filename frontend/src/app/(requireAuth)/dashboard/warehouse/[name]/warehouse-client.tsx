"use client"

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useState } from "react"
import { RackGridView } from "@/components/dashboard/rack-visualization/rack-grid-view"
import { RackParametersCard } from "@/components/dashboard/rack-visualization/rack-parameters-card"
import { RackStatusCard } from "@/components/dashboard/rack-visualization/rack-status-card"
import type { ItemSlot } from "@/components/dashboard/types"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function WarehouseClient({
  racks,
  warehouseId,
  warehouseName,
}: {
  racks: {
    id: string
    name: string
    rows: number
    cols: number
    minTemp: number
    maxTemp: number
    maxWeight: number
    currentWeight: number
    occupancy: number
    items: ItemSlot[]
  }[]
  warehouseId: string
  warehouseName: string
}) {
  const [currentRackIndex, setCurrentRackIndex] = useState(0)

  const currentRack = racks[currentRackIndex]

  const totalSlots = currentRack.rows * currentRack.cols
  const occupiedSlots = currentRack.items.filter((item) => item !== null).length
  const freeSlots = totalSlots - occupiedSlots

  const handlePreviousRack = () => {
    setCurrentRackIndex((prev) => (prev === 0 ? racks.length - 1 : prev - 1))
  }

  const handleNextRack = () => {
    setCurrentRackIndex((prev) => (prev === racks.length - 1 ? 0 : prev + 1))
  }

  // Extend rack data with maxElementSize
  const rackWithMaxSize = {
    ...currentRack,
    maxElementSize: { width: 500, height: 400, depth: 300 },
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-8 sm:size-10"
            )}
            href="/dashboard"
            title="Powrót do Dashboardu"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} />
          </Link>
          <div>
            <h2 className="font-bold text-xl tracking-tight sm:text-2xl lg:text-3xl">
              {warehouseName}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              ID: {warehouseId} • {currentRack.name}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Left Column - Grid Visualization */}
        <div className="xl:col-span-2">
          <RackGridView
            cols={currentRack.cols}
            currentRackIndex={currentRackIndex}
            items={currentRack.items}
            onNextRack={handleNextRack}
            onPreviousRack={handlePreviousRack}
            rack={currentRack}
            rows={currentRack.rows}
            totalRacks={racks.length}
          />
        </div>

        {/* Right Column - Parameters and Status */}
        <div className="space-y-6">
          <RackParametersCard
            gridDimensions={{
              cols: currentRack.cols,
              rows: currentRack.rows,
            }}
            maxElementSize={rackWithMaxSize.maxElementSize}
            tempRange={{ max: currentRack.maxTemp, min: currentRack.minTemp }}
          />
          <RackStatusCard
            freeSlots={freeSlots}
            occupancyPercentage={
              currentRack.occupancy ||
              Math.round((occupiedSlots / totalSlots) * 100)
            }
            occupiedSlots={occupiedSlots}
            totalCapacity={totalSlots}
          />
        </div>
      </div>
    </div>
  )
}
