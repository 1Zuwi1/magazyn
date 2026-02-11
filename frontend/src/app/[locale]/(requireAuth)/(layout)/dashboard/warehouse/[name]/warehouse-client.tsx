"use client"

import {
  Alert01Icon,
  CubeIcon,
  Layers01Icon,
  PackageIcon,
  RulerIcon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ItemDetailsDialog } from "@/components/dashboard/rack-visualization/item-details-dialog"
import { RackGridView } from "@/components/dashboard/rack-visualization/rack-grid-view"
import { RackParametersCard } from "@/components/dashboard/rack-visualization/rack-parameters-card"
import { RackShelfDetailsCard } from "@/components/dashboard/rack-visualization/rack-shelf-details-card"
import { RackStatusCard } from "@/components/dashboard/rack-visualization/rack-status-card"
import type {
  IconComponent,
  SlotCoordinates,
} from "@/components/dashboard/types"
import { buildItemsGrid } from "@/components/dashboard/utils/helpers"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import useAssortments from "@/hooks/use-assortment"
import { useCurrentWarehouseId } from "@/hooks/use-current-warehouse-id"
import useRacks from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import type { AppTranslate } from "@/i18n/use-translations"
import type { Rack } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

interface HeaderStat {
  label: string
  value: string | number
  icon?: IconComponent
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

const decodeWarehouseName = (encodedName: string): string => {
  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

const getWarehouseDisplayMessage = ({
  t,
  hasFetchError,
  hasWarehouse,
  hasRack,
  warehouseName,
}: {
  t: AppTranslate
  hasFetchError: boolean
  hasWarehouse: boolean
  hasRack: boolean
  warehouseName: string
}): string | null => {
  if (hasFetchError) {
    return t("generated.dashboard.warehouse.failedRetrieveStorageData")
  }
  if (!hasWarehouse) {
    return `Nie znaleziono magazynu o nazwie: ${warehouseName}`
  }
  if (!hasRack) {
    return t("generated.dashboard.warehouse.warehouseAnyRacksYet")
  }

  return null
}

function buildHeaderStats({
  t,
  currentRack,
  rackOccupancyPercentage,
  warehouseFreeSlots,
  warehouseOccupiedSlots,
  warehouseRacksCount,
}: {
  t: AppTranslate
  currentRack: Rack | null
  rackOccupancyPercentage: number
  warehouseFreeSlots: number
  warehouseOccupiedSlots: number
  warehouseRacksCount: number
}): HeaderStat[] {
  const warehouseTotalSlots = warehouseFreeSlots + warehouseOccupiedSlots
  const warehouseOccupancyPercentage =
    warehouseTotalSlots > 0
      ? Math.round((warehouseOccupiedSlots / warehouseTotalSlots) * 100)
      : 0
  const headerOccupancyPercentage = currentRack
    ? rackOccupancyPercentage
    : warehouseOccupancyPercentage
  const headerFreeSlots = currentRack
    ? currentRack.freeSlots
    : warehouseFreeSlots

  return [
    {
      label: t("generated.dashboard.shared.racks"),
      value: warehouseRacksCount,
      icon: Layers01Icon,
    },
    {
      label: t("generated.dashboard.shared.occupancy"),
      value: `${headerOccupancyPercentage}%`,
      variant: getOccupancyVariant(headerOccupancyPercentage),
    },
    {
      label: t("generated.dashboard.shared.free"),
      value: headerFreeSlots,
    },
  ]
}

function WarehouseLoadingSkeleton({
  warehouseName,
}: {
  warehouseName: string
}) {
  const t = useTranslations()

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle={t("generated.dashboard.warehouse.backWarehouseList")}
        stats={[
          {
            label: t("generated.dashboard.shared.racks"),
            value: "-",
            icon: Layers01Icon,
          },
          {
            label: t("generated.dashboard.shared.occupancy"),
            value: "-",
          },
          {
            label: t("generated.dashboard.shared.free"),
            value: "-",
          },
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
  const t = useTranslations()

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle={t("generated.dashboard.warehouse.backWarehouseList")}
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

const areSameSlotCoordinates = (
  left: SlotCoordinates | null,
  right: SlotCoordinates
): boolean => left?.x === right.x && left?.y === right.y

const getEncodedName = (name: string | string[] | undefined): string => {
  if (Array.isArray(name)) {
    return name[0] ?? ""
  }
  return name ?? ""
}

const parseIntegerFromQueryParam = (value: string | null): number | null => {
  if (!value) {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null
  }

  return parsedValue
}

const moveToPreviousRack = ({
  clearRackSelectionFromLink,
  resetSelection,
  setCurrentPage,
  totalPages,
}: {
  clearRackSelectionFromLink: () => void
  resetSelection: () => void
  setCurrentPage: Dispatch<SetStateAction<number>>
  totalPages: number
}): void => {
  if (totalPages <= 1) {
    return
  }
  clearRackSelectionFromLink()
  setCurrentPage((prev) => (prev <= 1 ? totalPages : prev - 1))
  resetSelection()
}

const moveToNextRack = ({
  clearRackSelectionFromLink,
  resetSelection,
  setCurrentPage,
  totalPages,
}: {
  clearRackSelectionFromLink: () => void
  resetSelection: () => void
  setCurrentPage: Dispatch<SetStateAction<number>>
  totalPages: number
}): void => {
  if (totalPages <= 1) {
    return
  }
  clearRackSelectionFromLink()
  setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1))
  resetSelection()
}

const activateRackSlot = ({
  assortments,
  coordinates,
  currentRack,
  setIsItemDetailsOpen,
  setSelectedSlotCoordinates,
}: {
  assortments:
    | { content: { positionX: number; positionY: number }[] }
    | null
    | undefined
  coordinates: SlotCoordinates
  currentRack: Rack | null
  setIsItemDetailsOpen: (isOpen: boolean) => void
  setSelectedSlotCoordinates: Dispatch<SetStateAction<SlotCoordinates | null>>
}): void => {
  if (!currentRack) {
    return
  }

  setSelectedSlotCoordinates(coordinates)

  const slotHasContent = assortments?.content.some(
    (a) => a.positionX === coordinates.x && a.positionY === coordinates.y
  )
  if (slotHasContent) {
    setIsItemDetailsOpen(true)
  }
}

function useRackSelectionFromLink({
  pagedRack,
  warehouseIdForQuery,
}: {
  pagedRack: Rack | null
  warehouseIdForQuery: number
}) {
  const searchParams = useSearchParams()
  const requestedRackIdFromSearchParams = useMemo(
    () => parseIntegerFromQueryParam(searchParams.get("rackId")),
    [searchParams]
  )
  const [selectedRackIdFromLink, setSelectedRackIdFromLink] = useState<
    number | null
  >(requestedRackIdFromSearchParams)
  const { data: rackFromLink, isPending: isRackFromLinkPending } = useRacks(
    {
      rackId: selectedRackIdFromLink ?? -1,
    },
    {
      enabled: selectedRackIdFromLink !== null,
    }
  )

  useEffect(() => {
    setSelectedRackIdFromLink(requestedRackIdFromSearchParams)
  }, [requestedRackIdFromSearchParams])

  const rackFromLinkInCurrentWarehouse =
    rackFromLink && rackFromLink.warehouseId === warehouseIdForQuery
      ? rackFromLink
      : null
  const currentRack = rackFromLinkInCurrentWarehouse ?? pagedRack
  const isRackFromLinkLoading =
    selectedRackIdFromLink !== null &&
    isRackFromLinkPending &&
    rackFromLinkInCurrentWarehouse === null &&
    pagedRack === null

  return {
    currentRack,
    isRackFromLinkLoading,
    isRackFromLinkActive: rackFromLinkInCurrentWarehouse !== null,
    clearRackSelectionFromLink: () => setSelectedRackIdFromLink(null),
  }
}

export default function WarehouseClient() {
  const t = useTranslations()

  const params = useParams<{ name: string }>()
  const encodedWarehouseName = getEncodedName(params?.name)
  const decodedWarehouseName = useMemo(
    () => decodeWarehouseName(encodedWarehouseName),
    [encodedWarehouseName]
  )
  const router = useRouter()
  const { warehouseIdForQuery, isHydrated, isMissingWarehouseId } =
    useCurrentWarehouseId({
      redirectIfMissingTo: "/dashboard/warehouse",
    })
  const [selectedSlotCoordinates, setSelectedSlotCoordinates] =
    useState<SlotCoordinates | null>(null)
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false)
  const [is3DWarningOpen, setIs3DWarningOpen] = useState(false)

  const {
    data: warehouse,
    isError: isWarehousesError,
    isPending: isWarehousesPending,
  } = useWarehouses({
    warehouseId: warehouseIdForQuery,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const {
    data: rackData,
    isError: isRacksError,
    isPending: isRacksPending,
  } = useRacks({
    warehouseId: warehouseIdForQuery,
    page: currentPage - 1,
    size: 1,
  })

  const pagedRack = rackData?.content[0] ?? null
  const {
    currentRack,
    isRackFromLinkLoading,
    isRackFromLinkActive,
    clearRackSelectionFromLink,
  } = useRackSelectionFromLink({
    pagedRack,
    warehouseIdForQuery,
  })

  const totalPages = rackData?.totalPages ?? 0
  const rackGridCurrentPage = isRackFromLinkActive ? 1 : currentPage
  const rackGridTotalPages = isRackFromLinkActive ? 1 : totalPages
  const hasFetchError = isWarehousesError || isRacksError
  const isLoading =
    !isHydrated ||
    isWarehousesPending ||
    isRacksPending ||
    isRackFromLinkLoading

  const { data: assortments } = useAssortments({
    rackId: currentRack?.id ?? -1,
    page: 0,
    size: currentRack ? currentRack.sizeX * currentRack.sizeY : 20,
  })

  const items = useMemo(() => {
    if (!(currentRack && assortments?.content)) {
      return []
    }
    return buildItemsGrid(
      currentRack.sizeX,
      currentRack.sizeY,
      assortments.content
    )
  }, [currentRack, assortments])

  const selectedSlotIndex = useMemo(() => {
    if (!(selectedSlotCoordinates && currentRack)) {
      return null
    }
    return (
      (selectedSlotCoordinates.y - 1) * currentRack.sizeX +
      (selectedSlotCoordinates.x - 1)
    )
  }, [selectedSlotCoordinates, currentRack])

  const selectedCoordinate = useMemo(() => {
    if (selectedSlotIndex === null || !currentRack) {
      return null
    }
    const row = Math.floor(selectedSlotIndex / currentRack.sizeX)
    const col = selectedSlotIndex % currentRack.sizeX
    return `R${String(row + 1).padStart(2, "0")}-${String(col + 1).padStart(2, "0")}`
  }, [selectedSlotIndex, currentRack])

  const selectedAssortment = useMemo(() => {
    if (!(selectedSlotCoordinates && assortments)) {
      return null
    }
    return (
      assortments.content.find((a) => {
        return (
          a.positionX - 1 === selectedSlotCoordinates.x &&
          a.positionY - 1 === selectedSlotCoordinates.y
        )
      }) ?? null
    )
  }, [selectedSlotCoordinates, assortments])

  const selectedItem = useMemo(() => {
    if (selectedSlotIndex === null) {
      return null
    }
    return items[selectedSlotIndex] ?? null
  }, [selectedSlotIndex, items])

  const resetSelection = () => {
    setSelectedSlotCoordinates(null)
    setIsItemDetailsOpen(false)
  }

  const handlePreviousRack = () => {
    moveToPreviousRack({
      clearRackSelectionFromLink,
      resetSelection,
      setCurrentPage,
      totalPages,
    })
  }

  const handleNextRack = () => {
    moveToNextRack({
      clearRackSelectionFromLink,
      resetSelection,
      setCurrentPage,
      totalPages,
    })
  }

  const handleSetPage = (page: number) => {
    clearRackSelectionFromLink()
    setCurrentPage(page)
    resetSelection()
  }

  const handleSelectSlot = (coordinates: SlotCoordinates) => {
    setSelectedSlotCoordinates((prev) =>
      areSameSlotCoordinates(prev, coordinates) ? null : coordinates
    )
  }

  const handleActivateSlot = (coordinates: SlotCoordinates) => {
    activateRackSlot({
      assortments,
      coordinates,
      currentRack,
      setIsItemDetailsOpen,
      setSelectedSlotCoordinates,
    })
  }

  const warehouseName = warehouse?.name ?? decodedWarehouseName
  const warehouseId = warehouse?.id

  const rackOccupancyPercentage = currentRack
    ? Math.round(
        (currentRack.occupiedSlots / Math.max(currentRack.totalSlots, 1)) * 100
      )
    : 0

  const headerStats = buildHeaderStats({
    t,
    currentRack,
    rackOccupancyPercentage,
    warehouseFreeSlots: warehouse?.freeSlots ?? 0,
    warehouseOccupiedSlots: warehouse?.occupiedSlots ?? 0,
    warehouseRacksCount: warehouse?.racksCount ?? 0,
  })

  const warehouseMessage = getWarehouseDisplayMessage({
    t,
    hasFetchError,
    hasWarehouse: Boolean(warehouse),
    hasRack: Boolean(currentRack),
    warehouseName,
  })

  if (isMissingWarehouseId) {
    return null
  }

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

  const renderWarehouseContent = () => (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/warehouse"
        backTitle={t("generated.dashboard.warehouse.backWarehouseList")}
        stats={headerStats}
        title={warehouseName}
      >
        {currentRack && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5" variant="outline">
              <HugeiconsIcon className="size-3" icon={Layers01Icon} />
              {currentRack.marker}
            </Badge>
            <Badge className="gap-1.5 font-mono" variant="outline">
              <HugeiconsIcon className="size-3" icon={RulerIcon} />
              {currentRack.sizeY}×{currentRack.sizeX}
            </Badge>
            <Badge className="gap-1.5 font-mono" variant="outline">
              <HugeiconsIcon className="size-3" icon={ThermometerIcon} />
              {t("generated.shared.cC", {
                value0: currentRack.minTemp.toString(),
                value1: currentRack.maxTemp.toString(),
              })}
            </Badge>
          </div>
        )}
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
          <span>{t("generated.shared.assortment")}</span>
        </Link>
        <Button
          className="gap-2"
          onClick={() => setIs3DWarningOpen(true)}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={CubeIcon} />
          <span>{t("generated.dashboard.warehouse.value3dView")}</span>
        </Button>
      </div>

      <AlertDialog onOpenChange={setIs3DWarningOpen} open={is3DWarningOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-500/10">
              <HugeiconsIcon
                className="text-amber-500"
                icon={Alert01Icon}
                size={24}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {t("generated.dashboard.shared.value3dViewWarehouse")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("generated.dashboard.shared.value3dVisualizationFetchesData")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("generated.shared.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                router.push(
                  `/dashboard/warehouse/${encodeURIComponent(warehouseName)}/3d-visualization`
                )
              }
            >
              {t("generated.dashboard.shared.open3dView")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      {currentRack && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
          {/* Grid Visualization */}
          <div className="order-1">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
              <RackGridView
                cols={currentRack.sizeX}
                currentPage={rackGridCurrentPage}
                items={items}
                onActivateSlot={handleActivateSlot}
                onNextRack={handleNextRack}
                onPreviousRack={handlePreviousRack}
                onSelectSlot={handleSelectSlot}
                onSetPage={handleSetPage}
                rows={currentRack.sizeY}
                selectedSlotCoordinates={selectedSlotCoordinates}
                totalPages={rackGridTotalPages}
              />
            </div>
          </div>

          {/* Right Column - Parameters and Status */}
          <div className="order-3 space-y-6 xl:order-2">
            <RackStatusCard
              freeSlots={currentRack.freeSlots}
              occupancyPercentage={rackOccupancyPercentage}
              occupiedSlots={currentRack.occupiedSlots}
              totalCapacity={currentRack.totalSlots}
            />
            <RackParametersCard
              gridDimensions={{
                cols: currentRack.sizeX,
                rows: currentRack.sizeY,
              }}
              maxElementSize={{
                depth: currentRack.maxSizeZ,
                height: currentRack.maxSizeY,
                width: currentRack.maxSizeX,
              }}
              tempRange={{
                max: currentRack.maxTemp,
                min: currentRack.minTemp,
              }}
            />
          </div>

          {/* Shelf Details */}
          <div className="order-2 xl:order-3 xl:col-span-2">
            <RackShelfDetailsCard
              assortment={selectedAssortment}
              onClearSelection={() => setSelectedSlotCoordinates(null)}
              rack={currentRack}
              selectedSlotCoordinates={selectedSlotCoordinates}
            />
          </div>
        </div>
      )}

      <ItemDetailsDialog
        coordinate={selectedCoordinate}
        item={selectedItem}
        onOpenChange={setIsItemDetailsOpen}
        open={isItemDetailsOpen}
        rackName={currentRack?.marker}
      />
    </div>
  )

  return renderWarehouseContent()
}
