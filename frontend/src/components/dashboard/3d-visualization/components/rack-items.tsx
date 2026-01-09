import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Item3D, ItemStatus, Rack3D } from "../types"
import {
  getItemVisuals,
  getWorstStatus,
  ITEM_STATUS_ORDER,
  RACK_ZONE_SIZE,
} from "../types"
import type { RackMetrics } from "./rack-metrics"
import {
  STRIPE_EMISSIVE_INTENSITY,
  STRIPE_MATERIAL_DEFAULTS,
  useStripeTexture,
} from "./stripe-texture"

interface DisplaySizeConfig {
  displayRows: number
  displayCols: number
  downsample: boolean
  displayUnitX: number
  displayUnitY: number
  displaySlotSize: { w: number; h: number; d: number }
}

interface RackSlot {
  position: [number, number, number]
  status: Item3D["status"]
}

export function getDisplaySize(
  rack: Rack3D,
  resolvedMetrics: RackMetrics
): DisplaySizeConfig {
  const displayRows = Math.min(rack.grid.rows, RACK_ZONE_SIZE)
  const displayCols = Math.min(rack.grid.cols, RACK_ZONE_SIZE)
  const downsample =
    displayRows !== rack.grid.rows || displayCols !== rack.grid.cols
  const displayUnitX =
    displayCols > 1 ? resolvedMetrics.gridWidth / (displayCols - 1) : 0
  const displayUnitY =
    displayRows > 1 ? resolvedMetrics.gridHeight / (displayRows - 1) : 0
  const displaySlotSize = downsample
    ? {
        w: Math.max(resolvedMetrics.slotSize.w, displayUnitX * 0.7),
        h: Math.max(
          resolvedMetrics.slotSize.h,
          displayUnitY > 0 ? displayUnitY * 0.7 : resolvedMetrics.slotSize.h
        ),
        d: resolvedMetrics.slotSize.d,
      }
    : resolvedMetrics.slotSize

  return {
    displayRows,
    displayCols,
    downsample,
    displayUnitX,
    displayUnitY,
    displaySlotSize,
  }
}

function getWorstStatusInGridCell(
  rack: Rack3D,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): ItemStatus | null {
  let worstStatus: ItemStatus | null = null

  for (let r = startRow; r < endRow; r++) {
    const rowOffset = r * rack.grid.cols
    for (let c = startCol; c < endCol; c++) {
      const item = rack.items[rowOffset + c]
      if (!item) {
        continue
      }
      worstStatus = getWorstStatus(worstStatus, item.status)
      if (worstStatus === "expired-dangerous") {
        return worstStatus
      }
    }
  }

  return worstStatus
}

function processDownsampledSlots(
  rack: Rack3D,
  resolvedMetrics: RackMetrics,
  displaySize: DisplaySizeConfig
): RackSlot[] {
  const { displayRows, displayCols, displayUnitX, displayUnitY } = displaySize
  const occupied: RackSlot[] = []
  const rowStep = rack.grid.rows / displayRows
  const colStep = rack.grid.cols / displayCols

  for (let row = 0; row < displayRows; row++) {
    const startRow = Math.floor(row * rowStep)
    const endRow = Math.min(rack.grid.rows, Math.floor((row + 1) * rowStep))
    const y =
      (displayRows - 1 - row) * displayUnitY - resolvedMetrics.gridHeight / 2

    for (let col = 0; col < displayCols; col++) {
      const startCol = Math.floor(col * colStep)
      const endCol = Math.min(rack.grid.cols, Math.floor((col + 1) * colStep))
      const worstStatus = getWorstStatusInGridCell(
        rack,
        startRow,
        endRow,
        startCol,
        endCol
      )

      if (!worstStatus) {
        continue
      }

      const x = col * displayUnitX - resolvedMetrics.gridWidth / 2
      occupied.push({ position: [x, y, 0], status: worstStatus })
    }
  }

  return occupied
}

function processFullSlots(
  rack: Rack3D,
  resolvedMetrics: RackMetrics
): RackSlot[] {
  const occupied: RackSlot[] = []

  for (let row = 0; row < rack.grid.rows; row++) {
    const y =
      (rack.grid.rows - 1 - row) * resolvedMetrics.unitY -
      resolvedMetrics.gridHeight / 2

    for (let col = 0; col < rack.grid.cols; col++) {
      const x = col * resolvedMetrics.unitX - resolvedMetrics.gridWidth / 2
      const index = row * rack.grid.cols + col
      const item = rack.items[index]

      if (!item) {
        continue
      }

      occupied.push({ position: [x, y, 0], status: item.status })
    }
  }

  return occupied
}

export function getOccupiedSlots(
  rack: Rack3D,
  resolvedMetrics: RackMetrics,
  displaySize: DisplaySizeConfig
): RackSlot[] {
  return displaySize.downsample
    ? processDownsampledSlots(rack, resolvedMetrics, displaySize)
    : processFullSlots(rack, resolvedMetrics)
}

interface RackItemsProps {
  slotSize: { w: number; h: number; d: number }
  items: RackSlot[]
}

export function RackItems({ slotSize, items }: RackItemsProps) {
  const stripeTexture = useStripeTexture()
  const groupedByStatus = useMemo(() => {
    const grouped: Record<ItemStatus, [number, number, number][]> = {
      normal: [],
      dangerous: [],
      expired: [],
      "expired-dangerous": [],
    }

    for (const item of items) {
      grouped[item.status].push(item.position)
    }

    return grouped
  }, [items])

  if (items.length === 0) {
    return null
  }

  return (
    <>
      {ITEM_STATUS_ORDER.map((status) => {
        const positions = groupedByStatus[status]
        if (!positions || positions.length === 0) {
          return null
        }
        const visuals = getItemVisuals(status)
        const stripeColor = visuals.stripeColor

        return (
          <group key={`occupied-${status}`}>
            <Instances frustumCulled={false} limit={positions.length}>
              <boxGeometry args={[slotSize.w, slotSize.h, slotSize.d]} />
              <meshStandardMaterial
                color={visuals.color}
                emissive={visuals.glow}
                emissiveIntensity={visuals.emissiveIntensity}
                metalness={0.08}
                roughness={0.75}
              />
              {positions.map((position, index) => (
                <Instance
                  key={`occupied-${status}-${index}`}
                  position={position}
                />
              ))}
            </Instances>
            {stripeColor && stripeTexture && (
              <Instances
                frustumCulled={false}
                limit={positions.length}
                renderOrder={1}
              >
                <boxGeometry args={[slotSize.w, slotSize.h, slotSize.d]} />
                <meshStandardMaterial
                  {...STRIPE_MATERIAL_DEFAULTS}
                  alphaMap={stripeTexture}
                  color={stripeColor}
                  emissive={stripeColor}
                  emissiveIntensity={STRIPE_EMISSIVE_INTENSITY}
                />
                {positions.map((position, index) => (
                  <Instance
                    key={`occupied-${status}-stripe-${index}`}
                    position={position}
                  />
                ))}
              </Instances>
            )}
          </group>
        )
      })}
    </>
  )
}
