import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Item3D, Rack3D } from "../types"
import { getItemColor } from "../types"

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

export const getRackMetrics = (rack: Rack3D): RackMetrics => {
  const unitX = rack.cell.w + rack.spacing.x
  const unitY = rack.cell.h + rack.spacing.y
  const gridWidth = rack.grid.cols * unitX
  const gridHeight = Math.max(0, rack.grid.rows - 1) * unitY
  const framePadding = rack.frame?.padding ?? 0.05
  const frameThickness = rack.frame?.thickness ?? 0.03
  const slotSize = {
    w: rack.cell.w * 0.8,
    h: rack.cell.h * 0.75,
    d: rack.cell.d * 0.7,
  }
  const width = gridWidth + slotSize.w + framePadding * 2
  const height = gridHeight + slotSize.h + framePadding * 2
  const depth = rack.cell.d + framePadding * 2
  const shelfThickness = Math.max(frameThickness * 0.6, 0.01)

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
}

export function RackFrame({ metrics, shelfPositions, hovered }: RackFrameProps) {
  const {
    width,
    height,
    depth,
    frameThickness,
    shelfThickness,
    framePadding,
  } = metrics
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfDepth = depth / 2
  const postOffsetX = halfWidth - frameThickness / 2
  const postOffsetZ = halfDepth - frameThickness / 2
  const beamLengthX = width - frameThickness * 2
  const beamLengthZ = depth - frameThickness * 2
  const frameColor = hovered ? "#94a3b8" : "#a1a1aa"
  const shelfColor = hovered ? "#e2e8f0" : "#f1f5f9"
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
        <mesh key={`post-${index}`} position={position}>
          <boxGeometry args={[frameThickness, height, frameThickness]} />
          <meshStandardMaterial color={frameColor} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {beamXPositions.map((position, index) => (
        <mesh key={`beam-x-${index}`} position={position}>
          <boxGeometry args={[beamLengthX, frameThickness, frameThickness]} />
          <meshStandardMaterial color={frameColor} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {beamZPositions.map((position, index) => (
        <mesh key={`beam-z-${index}`} position={position}>
          <boxGeometry args={[frameThickness, frameThickness, beamLengthZ]} />
          <meshStandardMaterial color={frameColor} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
      {shelfPositions.map((y, index) => (
        <mesh key={`shelf-${index}`} position={[0, y, 0]}>
          <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
          <meshStandardMaterial color={shelfColor} metalness={0.1} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

interface RackItemsProps {
  metrics: RackMetrics
  items: { position: [number, number, number]; status: Item3D["status"] }[]
}

function RackItems({ metrics, items }: RackItemsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Instances limit={items.length}>
      <boxGeometry args={[metrics.slotSize.w, metrics.slotSize.h, metrics.slotSize.d]} />
      <meshStandardMaterial metalness={0.15} roughness={0.6} />
      {items.map(({ position, status }, index) => (
        <Instance color={getItemColor(status)} key={`occupied-${index}`} position={position} />
      ))}
    </Instances>
  )
}

interface RackStructureProps {
  rack: Rack3D
  metrics?: RackMetrics
  hovered?: boolean
  showItems?: boolean
}

export function RackStructure({
  rack,
  metrics,
  hovered = false,
  showItems = true,
}: RackStructureProps) {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)

  const { occupiedSlots, shelfPositions } = useMemo(() => {
    const occupied: {
      position: [number, number, number]
      status: Item3D["status"]
    }[] = []
    const shelves: number[] = []

    for (let row = 0; row < rack.grid.rows; row++) {
      const y =
        (rack.grid.rows - 1 - row) * resolvedMetrics.unitY -
        resolvedMetrics.gridHeight / 2
      const shelfY = y - rack.cell.h / 2 + resolvedMetrics.shelfThickness / 2
      shelves.push(shelfY)

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

    return { occupiedSlots: occupied, shelfPositions: shelves }
  }, [
    rack.cell.h,
    rack.grid.cols,
    rack.grid.rows,
    rack.items,
    resolvedMetrics.gridHeight,
    resolvedMetrics.gridWidth,
    resolvedMetrics.shelfThickness,
    resolvedMetrics.unitX,
    resolvedMetrics.unitY,
  ])

  return (
    <>
      <RackFrame hovered={hovered} metrics={resolvedMetrics} shelfPositions={shelfPositions} />
      {showItems && <RackItems items={occupiedSlots} metrics={resolvedMetrics} />}
    </>
  )
}
