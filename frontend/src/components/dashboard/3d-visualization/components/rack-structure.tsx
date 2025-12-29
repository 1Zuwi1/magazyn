import { Edges, Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Item3D, ItemStatus, Rack3D } from "../types"
import {
  getItemVisuals,
  getWorstStatus,
  ITEM_STATUS_ORDER,
  RACK_ZONE_SIZE,
} from "../types"

export interface RackMetrics {
  width: number
  height: number
  depth: number
  unitX: number
  unitY: number
  gridWidth: number
  gridHeight: number
  frameThickness: number
  framePadding: number
  shelfThickness: number
  slotSize: { w: number; h: number; d: number }
}

export interface RackTone {
  frame: string
  frameHover: string
  shelf: string
  shelfHover: string
  outline: string
  outlineHover: string
  glow: string
}

export const DEFAULT_RACK_TONE: RackTone = {
  frame: "#9aa3af",
  frameHover: "#b6c0cd",
  shelf: "#d6dbe2",
  shelfHover: "#e6ebf1",
  outline: "#6b7280",
  outlineHover: "#94a3b8",
  glow: "#7c8798",
}

interface ShelfGridConfig {
  rows: number
  unitY: number
  gridHeight: number
  cellHeight: number
  shelfThickness: number
}

export function getShelfPositionsForGrid({
  rows,
  unitY,
  gridHeight,
  cellHeight,
  shelfThickness,
}: ShelfGridConfig): number[] {
  const positions: number[] = []

  for (let row = 0; row < rows; row++) {
    const y = (rows - 1 - row) * unitY - gridHeight / 2
    const shelfY = y - cellHeight / 2 + shelfThickness / 2
    positions.push(shelfY)
  }

  return positions
}

interface RackShelvesProps {
  shelfPositions: number[]
  width: number
  depth: number
  thickness: number
  color?: string
}

export function RackShelves({
  shelfPositions,
  width,
  depth,
  thickness,
  color = DEFAULT_RACK_TONE.shelf,
}: RackShelvesProps) {
  if (shelfPositions.length === 0) {
    return null
  }

  return (
    <group>
      {shelfPositions.map((y, index) => (
        <mesh key={`shelf-${index}`} position={[0, y, 0]} raycast={() => null}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial
            color={color}
            metalness={0.05}
            roughness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

export const getRackMetrics = (rack: Rack3D): RackMetrics => {
  const unitX = rack.cell.w + rack.spacing.x
  const unitY = rack.cell.h + rack.spacing.y
  const gridWidth = rack.grid.cols * unitX
  const gridHeight = Math.max(0, rack.grid.rows - 1) * unitY
  const framePadding = rack.frame?.padding ?? 0.05
  const frameThickness = Math.max(rack.frame?.thickness ?? 0.03, 0.04)
  const slotSize = {
    w: rack.cell.w * 0.8,
    h: rack.cell.h * 0.75,
    d: rack.cell.d * 0.7,
  }
  const width = gridWidth + slotSize.w + framePadding * 2
  const height = gridHeight + slotSize.h + framePadding * 2
  const depth = rack.cell.d + framePadding * 2
  const shelfThickness = Math.max(frameThickness * 0.45, 0.012)

  return {
    width,
    height,
    depth,
    unitX,
    unitY,
    gridWidth,
    gridHeight,
    frameThickness,
    framePadding,
    shelfThickness,
    slotSize,
  }
}

interface RackFrameProps {
  metrics: RackMetrics
  shelfPositions: number[]
  hovered: boolean
  tone: RackTone
}

export function RackFrame({
  metrics,
  shelfPositions,
  hovered,
  tone,
}: RackFrameProps) {
  const { width, height, depth, frameThickness, shelfThickness, framePadding } =
    metrics
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfDepth = depth / 2
  const postOffsetX = halfWidth - frameThickness / 2
  const postOffsetZ = halfDepth - frameThickness / 2
  const beamLengthX = width - frameThickness * 2
  const beamLengthZ = depth - frameThickness * 2
  const frameColor = hovered ? tone.frameHover : tone.frame
  const shelfColor = hovered ? tone.shelfHover : tone.shelf
  const outlineColor = hovered ? tone.outlineHover : tone.outline
  const emissiveIntensity = hovered ? 0.18 : 0.1
  const shelfWidth = beamLengthX - framePadding
  const shelfDepth = beamLengthZ - framePadding

  const postPositions: [number, number, number][] = [
    [postOffsetX, 0, postOffsetZ],
    [postOffsetX, 0, -postOffsetZ],
    [-postOffsetX, 0, postOffsetZ],
    [-postOffsetX, 0, -postOffsetZ],
  ]

  const beamXPositions: [number, number, number][] = [
    [0, halfHeight - frameThickness / 2, postOffsetZ],
    [0, halfHeight - frameThickness / 2, -postOffsetZ],
    [0, -halfHeight + frameThickness / 2, postOffsetZ],
    [0, -halfHeight + frameThickness / 2, -postOffsetZ],
  ]

  const beamZPositions: [number, number, number][] = [
    [postOffsetX, halfHeight - frameThickness / 2, 0],
    [-postOffsetX, halfHeight - frameThickness / 2, 0],
    [postOffsetX, -halfHeight + frameThickness / 2, 0],
    [-postOffsetX, -halfHeight + frameThickness / 2, 0],
  ]

  return (
    <group>
      {postPositions.map((position, index) => (
        <mesh
          castShadow
          key={`post-${index}`}
          position={position}
          receiveShadow
        >
          <boxGeometry args={[frameThickness, height, frameThickness]} />
          <meshStandardMaterial
            color={frameColor}
            emissive={tone.glow}
            emissiveIntensity={emissiveIntensity}
            metalness={0.25}
            roughness={0.5}
          />
          <Edges
            color={outlineColor}
            lineWidth={1.1}
            opacity={0.7}
            scale={1.01}
            transparent
          />
        </mesh>
      ))}
      {beamXPositions.map((position, index) => (
        <mesh
          castShadow
          key={`beam-x-${index}`}
          position={position}
          receiveShadow
        >
          <boxGeometry args={[beamLengthX, frameThickness, frameThickness]} />
          <meshStandardMaterial
            color={frameColor}
            emissive={tone.glow}
            emissiveIntensity={emissiveIntensity}
            metalness={0.25}
            roughness={0.5}
          />
          <Edges
            color={outlineColor}
            lineWidth={1.1}
            opacity={0.7}
            scale={1.01}
            transparent
          />
        </mesh>
      ))}
      {beamZPositions.map((position, index) => (
        <mesh
          castShadow
          key={`beam-z-${index}`}
          position={position}
          receiveShadow
        >
          <boxGeometry args={[frameThickness, frameThickness, beamLengthZ]} />
          <meshStandardMaterial
            color={frameColor}
            emissive={tone.glow}
            emissiveIntensity={emissiveIntensity}
            metalness={0.25}
            roughness={0.5}
          />
          <Edges
            color={outlineColor}
            lineWidth={1.1}
            opacity={0.7}
            scale={1.01}
            transparent
          />
        </mesh>
      ))}
      {shelfPositions.map((y, index) => (
        <mesh key={`shelf-${index}`} position={[0, y, 0]} receiveShadow>
          <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
          <meshStandardMaterial
            color={shelfColor}
            metalness={0.05}
            roughness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

interface RackItemsProps {
  slotSize: { w: number; h: number; d: number }
  items: { position: [number, number, number]; status: Item3D["status"] }[]
}

function RackItems({ slotSize, items }: RackItemsProps) {
  if (items.length === 0) {
    return null
  }

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

  return (
    <>
      {ITEM_STATUS_ORDER.map((status) => {
        const positions = groupedByStatus[status]
        if (!positions || positions.length === 0) {
          return null
        }
        const visuals = getItemVisuals(status)

        return (
          <Instances
            frustumCulled={false}
            key={`occupied-${status}`}
            limit={positions.length}
          >
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
        )
      })}
    </>
  )
}

interface RackStructureProps {
  rack: Rack3D
  metrics?: RackMetrics
  hovered?: boolean
  showItems?: boolean
  showShelves?: boolean
  tone?: RackTone
}

export function RackStructure({
  rack,
  metrics,
  hovered = false,
  showItems = true,
  showShelves = true,
  tone,
}: RackStructureProps) {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const resolvedTone = tone ?? DEFAULT_RACK_TONE

  const { occupiedSlots, shelfPositions, slotSize } = useMemo(() => {
    const occupied: {
      position: [number, number, number]
      status: Item3D["status"]
    }[] = []
    const shelves: number[] = []
    const displayRows = Math.min(rack.grid.rows, RACK_ZONE_SIZE)
    const displayCols = Math.min(rack.grid.cols, RACK_ZONE_SIZE)
    const downsample =
      displayRows !== rack.grid.rows || displayCols !== rack.grid.cols
    const displayUnitX = resolvedMetrics.gridWidth / Math.max(1, displayCols)
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

    if (showShelves) {
      shelves.push(
        ...getShelfPositionsForGrid({
          rows: displayRows,
          unitY: displayUnitY,
          gridHeight: resolvedMetrics.gridHeight,
          cellHeight: rack.cell.h,
          shelfThickness: resolvedMetrics.shelfThickness,
        })
      )
    }

    if (!showItems) {
      return {
        occupiedSlots: occupied,
        shelfPositions: shelves,
        slotSize: displaySlotSize,
      }
    }

    if (downsample) {
      const rowStep = rack.grid.rows / displayRows
      const colStep = rack.grid.cols / displayCols

      for (let row = 0; row < displayRows; row++) {
        const startRow = Math.floor(row * rowStep)
        const endRow = Math.min(rack.grid.rows, Math.floor((row + 1) * rowStep))
        const y =
          (displayRows - 1 - row) * displayUnitY -
          resolvedMetrics.gridHeight / 2

        for (let col = 0; col < displayCols; col++) {
          const startCol = Math.floor(col * colStep)
          const endCol = Math.min(
            rack.grid.cols,
            Math.floor((col + 1) * colStep)
          )
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
                break
              }
            }
            if (worstStatus === "expired-dangerous") {
              break
            }
          }

          if (!worstStatus) {
            continue
          }

          const x = col * displayUnitX - resolvedMetrics.gridWidth / 2
          occupied.push({ position: [x, y, 0], status: worstStatus })
        }
      }
    } else {
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
    }

    return {
      occupiedSlots: occupied,
      shelfPositions: shelves,
      slotSize: displaySlotSize,
    }
  }, [
    showItems,
    showShelves,
    rack.cell.h,
    rack.grid.cols,
    rack.grid.rows,
    rack.items,
    resolvedMetrics.gridHeight,
    resolvedMetrics.gridWidth,
    resolvedMetrics.shelfThickness,
    resolvedMetrics.slotSize.d,
    resolvedMetrics.slotSize.h,
    resolvedMetrics.slotSize.w,
    resolvedMetrics.unitX,
    resolvedMetrics.unitY,
  ])

  return (
    <>
      <RackFrame
        hovered={hovered}
        metrics={resolvedMetrics}
        shelfPositions={shelfPositions}
        tone={resolvedTone}
      />
      {showItems && <RackItems items={occupiedSlots} slotSize={slotSize} />}
    </>
  )
}
