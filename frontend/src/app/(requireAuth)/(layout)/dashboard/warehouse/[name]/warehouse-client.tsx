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
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ItemDetailsDialog } from "@/components/dashboard/rack-visualization/item-details-dialog"
import { RackGridView } from "@/components/dashboard/rack-visualization/rack-grid-view"
import { RackParametersCard } from "@/components/dashboard/rack-visualization/rack-parameters-card"
import { RackShelfDetailsCard } from "@/components/dashboard/rack-visualization/rack-shelf-details-card"
import { RackStatusCard } from "@/components/dashboard/rack-visualization/rack-status-card"
import type { ItemSlot, Rack } from "@/components/dashboard/types"
import { getSlotCoordinate } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import useRacks, { type RacksList } from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import { cn } from "@/lib/utils"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90
const WAREHOUSES_PAGE_SIZE = 200
const RACKS_PAGE_SIZE = 500
const DEFAULT_MAX_ELEMENT_SIZE = { width: 500, height: 400, depth: 300 }

interface HeaderStat {
  label: string
  value: string | number
  icon?: typeof Layers01Icon
  variant?: "default" | "warning" | "destructive"
}

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

function mapRackToVisualization(
  rack: RacksList["content"][number],
  slotItems: ItemSlot[] = []
): Rack {
  const rows = Math.max(1, rack.sizeY)
  const cols = Math.max(1, rack.sizeX)
  const totalSlots = rows * cols
  const paddedItems = [
    ...slotItems.slice(0, totalSlots),
    ...Array.from(
      { length: Math.max(0, totalSlots - slotItems.length) },
      () => null
    ),
  ]

  return {
    id: String(rack.id),
    marker: rack.marker,
    name: rack.marker || `Regał ${rack.id}`,
    rows,
    cols,
    minTemp: rack.minTemp,
    maxTemp: rack.maxTemp,
    maxWeight: rack.maxWeight,
    currentWeight: 0,
    maxItemWidth: rack.maxSizeX,
    maxItemHeight: rack.maxSizeY,
    maxItemDepth: rack.maxSizeZ,
    comment: rack.comment,
    occupancy: 0,
    items: paddedItems,
  }
}

const decodeWarehouseName = (encodedName: string): string => {
  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

const getWarehouseDisplayMessage = ({
  hasFetchError,
  hasWarehouse,
  hasRack,
  warehouseName,
}: {
  hasFetchError: boolean
  hasWarehouse: boolean
  hasRack: boolean
  warehouseName: string
}): string | null => {
  if (hasFetchError) {
    return "Nie udało się pobrać danych magazynu."
  }
  if (!hasWarehouse) {
    return `Nie znaleziono magazynu o nazwie: ${warehouseName}`
  }
  if (!hasRack) {
    return "Ten magazyn nie ma jeszcze żadnych regałów."
  }

  return null
}

function buildHeaderStats({
  racks,
  freeSlots,
  occupancyPercentage,
  warehouseFreeSlots,
  warehouseOccupiedSlots,
  warehouseRacksCount,
}: {
  racks: Rack[]
  freeSlots: number
  occupancyPercentage: number
  warehouseFreeSlots: number
  warehouseOccupiedSlots: number
  warehouseRacksCount: number
}): HeaderStat[] {
  const warehouseTotalSlots = warehouseFreeSlots + warehouseOccupiedSlots
  const warehouseOccupancyPercentage =
    warehouseTotalSlots > 0
      ? Math.round((warehouseOccupiedSlots / warehouseTotalSlots) * 100)
      : 0
  const headerOccupancyPercentage =
    racks.length > 0 ? occupancyPercentage : warehouseOccupancyPercentage
  const headerFreeSlots = racks.length > 0 ? freeSlots : warehouseFreeSlots

  return [
    {
      label: "Regałów",
      value: racks.length || warehouseRacksCount,
      icon: Layers01Icon,
    },
    {
      label: "Obłożenie",
      value: `${headerOccupancyPercentage}%`,
      variant: getOccupancyVariant(headerOccupancyPercentage),
    },
    {
      label: "Wolnych",
      value: headerFreeSlots,
    },
  ]
}

function WarehouseLoadingSkeleton({
  warehouseName,
}: {
  warehouseName: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle="Powrót do listy magazynów"
        stats={[
          { label: "Regałów", value: "-", icon: Layers01Icon },
          { label: "Obłożenie", value: "-" },
          { label: "Wolnych", value: "-" },
        ]}
        title={warehouseName}
      >
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      </PageHeader>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
        {/* Grid visualization skeleton */}
        <div className="order-1">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Grid header */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
            {/* Grid body */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }).map((_, index) => (
                  <Skeleton
                    className="aspect-square rounded-lg"
                    key={index}
                    style={{ animationDelay: `${index * 50}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="order-3 space-y-6 xl:order-2">
          {/* Status card skeleton */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="border-b px-4 py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-14" />
              </div>
              <Skeleton className="mt-3 h-3 w-full rounded-full" />
            </div>
            <div className="grid grid-cols-3 divide-x">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  className="flex flex-col items-center gap-1 px-3 py-4"
                  key={index}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Parameters card skeleton */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  key={index}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <Skeleton className="size-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shelf details skeleton */}
        <div className="order-2 xl:order-3 xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="p-6">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WarehouseStateView({
  headerStats,
  warehouseName,
  titleBadge,
  message,
}: {
  headerStats: HeaderStat[]
  warehouseName: string
  titleBadge?: string
  message: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle="Powrót do listy magazynów"
        stats={headerStats}
        title={warehouseName}
        titleBadge={titleBadge}
      />
      <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
        {message}
      </div>
    </div>
  )
}

function getRackDerivedValues(
  currentRack: Rack | undefined,
  selectedSlotIndex: number | null
) {
  if (!currentRack) {
    return {
      selectedItem: null,
      selectedCoordinate: null,
      totalSlots: 0,
      occupiedSlots: 0,
      freeSlots: 0,
      occupancyPercentage: 0,
    }
  }

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
    currentRack.occupancy ||
    (totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0)

  return {
    selectedItem,
    selectedCoordinate,
    totalSlots,
    occupiedSlots,
    freeSlots,
    occupancyPercentage,
  }
}

export default function WarehouseClient() {
  const params = useParams<{ name: string }>()
  const encodedWarehouseName = Array.isArray(params?.name)
    ? (params.name[0] ?? "")
    : (params?.name ?? "")
  const decodedWarehouseName = useMemo(
    () => decodeWarehouseName(encodedWarehouseName),
    [encodedWarehouseName]
  )

  const {
    data: warehousesData,
    isError: isWarehousesError,
    isPending: isWarehousesPending,
  } = useWarehouses({
    page: 0,
    size: WAREHOUSES_PAGE_SIZE,
  })
  const {
    data: racksData,
    isError: isRacksError,
    isPending: isRacksPending,
  } = useRacks({
    page: 0,
    size: RACKS_PAGE_SIZE,
  })

  const warehouse = useMemo(
    () =>
      warehousesData?.content.find(
        (candidate) =>
          candidate.name.toLocaleLowerCase() ===
          decodedWarehouseName.toLocaleLowerCase()
      ),
    [decodedWarehouseName, warehousesData?.content]
  )

  const racks = useMemo(() => {
    if (!warehouse) {
      return []
    }

    return (racksData?.content ?? [])
      .filter((rack) => rack.warehouseId === warehouse.id)
      .map((rack) => mapRackToVisualization(rack))
  }, [racksData?.content, warehouse])

  const hasFetchError = isWarehousesError || isRacksError
  const isLoading = isWarehousesPending || isRacksPending
  const [currentRackIndex, setCurrentRackIndex] = useState(0)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  )
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false)

  const currentRack = racks[currentRackIndex]
  const {
    selectedItem,
    selectedCoordinate,
    totalSlots,
    occupiedSlots,
    freeSlots,
    occupancyPercentage,
  } = getRackDerivedValues(currentRack, selectedSlotIndex)

  const handlePreviousRack = () => {
    if (racks.length <= 1) {
      return
    }
    setCurrentRackIndex((prev) => (prev === 0 ? racks.length - 1 : prev - 1))
    setSelectedSlotIndex(null)
    setIsItemDetailsOpen(false)
  }

  const handleNextRack = () => {
    if (racks.length <= 1) {
      return
    }
    setCurrentRackIndex((prev) => (prev === racks.length - 1 ? 0 : prev + 1))
    setSelectedSlotIndex(null)
    setIsItemDetailsOpen(false)
  }

  const handleSetRackIndex = (index: number) => {
    setCurrentRackIndex(index)
    setSelectedSlotIndex(null)
    setIsItemDetailsOpen(false)
  }

  const handleSelectSlot = (index: number) => {
    setSelectedSlotIndex((prev) => (prev === index ? null : index))
  }

  const handleActivateSlot = (index: number) => {
    if (!currentRack) {
      return
    }

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
    if (racks.length === 0) {
      setCurrentRackIndex(0)
      setSelectedSlotIndex(null)
      setIsItemDetailsOpen(false)
      return
    }

    if (currentRackIndex >= racks.length) {
      setCurrentRackIndex(0)
      setSelectedSlotIndex(null)
      setIsItemDetailsOpen(false)
    }
  }, [currentRackIndex, racks.length])

  useEffect(() => {
    if (!selectedItem) {
      setIsItemDetailsOpen(false)
    }
  }, [selectedItem])

  const warehouseName = warehouse?.name ?? decodedWarehouseName
  const warehouseId = warehouse?.id

  const headerStats = buildHeaderStats({
    racks,
    freeSlots,
    occupancyPercentage,
    warehouseFreeSlots: warehouse?.freeSlots ?? 0,
    warehouseOccupiedSlots: warehouse?.occupiedSlots ?? 0,
    warehouseRacksCount: warehouse?.racksCount ?? 0,
  })

  const warehouseMessage = getWarehouseDisplayMessage({
    hasFetchError,
    hasWarehouse: Boolean(warehouse),
    hasRack: Boolean(currentRack),
    warehouseName,
  })

  if (isLoading) {
    return <WarehouseLoadingSkeleton warehouseName={warehouseName} />
  }

  if (warehouseMessage) {
    return (
      <WarehouseStateView
        headerStats={headerStats}
        message={warehouseMessage}
        titleBadge={
          warehouseId !== undefined ? `ID: ${warehouseId}` : undefined
        }
        warehouseName={warehouseName}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle="Powrót do listy magazynów"
        stats={headerStats}
        title={warehouseName}
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
            onSetRack={handleSetRackIndex}
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
            maxElementSize={DEFAULT_MAX_ELEMENT_SIZE}
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
