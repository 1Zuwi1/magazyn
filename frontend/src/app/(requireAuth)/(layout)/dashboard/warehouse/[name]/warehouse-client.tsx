"use client"

import {
  CubeIcon,
  Layers01Icon,
  PackageIcon,
  RulerIcon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ItemDetailsDialog } from "@/components/dashboard/rack-visualization/item-details-dialog"
import { RackGridView } from "@/components/dashboard/rack-visualization/rack-grid-view"
import { RackParametersCard } from "@/components/dashboard/rack-visualization/rack-parameters-card"
import { RackShelfDetailsCard } from "@/components/dashboard/rack-visualization/rack-shelf-details-card"
import { RackStatusCard } from "@/components/dashboard/rack-visualization/rack-status-card"
import type { ItemSlot } from "@/components/dashboard/types"
import { getSlotCoordinate } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

function getOccupancyVariant(
  occupancy: number
): "default" | "warning" | "destructive" {
  if (occupancy >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (occupancy >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "default"
}

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
    maxItemWidth: number
    maxItemHeight: number
    maxItemDepth: number
    currentWeight: number
    occupancy: number
    items: ItemSlot[]
  }[]
  warehouseId: string
  warehouseName: string
}) {
  const [currentRackIndex, setCurrentRackIndex] = useState(0)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  )
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false)

  const currentRack = racks[currentRackIndex]
  const selectedItem =
    selectedSlotIndex !== null ? currentRack.items[selectedSlotIndex] : null
  const selectedCoordinate =
    selectedSlotIndex !== null
      ? getSlotCoordinate(selectedSlotIndex, currentRack.cols)
      : null

  const totalSlots = currentRack.rows * currentRack.cols
  const occupiedSlots = currentRack.items.filter((item) => item !== null).length
  const freeSlots = totalSlots - occupiedSlots
  const occupancyPercentage =
    currentRack.occupancy || Math.round((occupiedSlots / totalSlots) * 100)

  const handlePreviousRack = () => {
    setCurrentRackIndex((prev) => (prev === 0 ? racks.length - 1 : prev - 1))
  }

  const handleNextRack = () => {
    setCurrentRackIndex((prev) => (prev === racks.length - 1 ? 0 : prev + 1))
  }

  const handleSelectSlot = (index: number) => {
    setSelectedSlotIndex((prev) => (prev === index ? null : index))
  }

  const handleActivateSlot = (index: number) => {
    setSelectedSlotIndex(index)
    if (currentRack.items[index]) {
      setIsItemDetailsOpen(true)
    }
  }

  const handleOpenDetails = () => {
    if (selectedItem) {
      setIsItemDetailsOpen(true)
    }
  }

  useEffect(() => {
    if (currentRackIndex >= 0) {
      setSelectedSlotIndex(null)
      setIsItemDetailsOpen(false)
    }
  }, [currentRackIndex])

  useEffect(() => {
    if (!selectedItem) {
      setIsItemDetailsOpen(false)
    }
  }, [selectedItem])

  // Extend rack data with maxElementSize
  const rackWithMaxSize = {
    ...currentRack,
    maxElementSize: { width: 500, height: 400, depth: 300 },
  }

  const headerStats = [
    {
      label: "Regałów",
      value: racks.length,
      icon: Layers01Icon,
    },
    {
      label: "Obłożenie",
      value: `${occupancyPercentage}%`,
      variant: getOccupancyVariant(occupancyPercentage),
    },
    {
      label: "Wolnych",
      value: freeSlots,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle="Powrót do listy magazynów"
        stats={headerStats}
        title={warehouseName}
        titleBadge={`ID: ${warehouseId}`}
      >
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5" variant="outline">
            <HugeiconsIcon className="size-3" icon={Layers01Icon} />
            {currentRack.name}
          </Badge>
          <Badge className="gap-1.5 font-mono" variant="outline">
            <HugeiconsIcon className="size-3" icon={RulerIcon} />
            {currentRack.rows}×{currentRack.cols}
          </Badge>
          <Badge className="gap-1.5 font-mono" variant="outline">
            <HugeiconsIcon className="size-3" icon={ThermometerIcon} />
            {currentRack.minTemp}°C – {currentRack.maxTemp}°C
          </Badge>
        </div>
      </PageHeader>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2"
          )}
          href={`/dashboard/warehouse/${encodeURIComponent(warehouseName)}/assortment`}
        >
          <HugeiconsIcon className="size-4" icon={PackageIcon} />
          <span>Asortyment</span>
        </Link>
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2"
          )}
          href={`/dashboard/warehouse/${encodeURIComponent(warehouseName)}/3d-visualization`}
        >
          <HugeiconsIcon className="size-4" icon={CubeIcon} />
          <span>Widok 3D</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
        {/* Grid Visualization */}
        <div className="order-1">
          <RackGridView
            cols={currentRack.cols}
            currentRackIndex={currentRackIndex}
            items={currentRack.items}
            onActivateSlot={handleActivateSlot}
            onNextRack={handleNextRack}
            onPreviousRack={handlePreviousRack}
            onSelectSlot={handleSelectSlot}
            onSetRack={setCurrentRackIndex}
            rack={currentRack}
            rows={currentRack.rows}
            selectedSlotIndex={selectedSlotIndex}
            totalRacks={racks.length}
          />
        </div>

        {/* Right Column - Parameters and Status */}
        <div className="order-3 space-y-6 xl:order-2">
          <RackStatusCard
            freeSlots={freeSlots}
            occupancyPercentage={occupancyPercentage}
            occupiedSlots={occupiedSlots}
            totalCapacity={totalSlots}
          />
          <RackParametersCard
            gridDimensions={{
              cols: currentRack.cols,
              rows: currentRack.rows,
            }}
            maxElementSize={rackWithMaxSize.maxElementSize}
            tempRange={{ max: currentRack.maxTemp, min: currentRack.minTemp }}
          />
        </div>

        {/* Shelf Details */}
        <div className="order-2 xl:order-3 xl:col-span-2">
          <RackShelfDetailsCard
            onClearSelection={() => setSelectedSlotIndex(null)}
            onOpenDetails={handleOpenDetails}
            rack={currentRack}
            selectedIndex={selectedSlotIndex}
          />
        </div>
      </div>

      <ItemDetailsDialog
        coordinate={selectedCoordinate}
        item={selectedItem ?? null}
        onOpenChange={setIsItemDetailsOpen}
        open={isItemDetailsOpen}
        rackName={currentRack.name}
      />
    </div>
  )
}
