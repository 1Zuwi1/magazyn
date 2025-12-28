import { Edges, Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Item3D, ItemStatus, Rack3D } from "../types"
import { getItemVisuals, ITEM_STATUS_ORDER } from "../types"

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

const DEFAULT_RACK_TONE: RackTone = {
  frame: "#9aa3af",
  frameHover: "#b6c0cd",
  shelf: "#d6dbe2",
  shelfHover: "#e6ebf1",
  outline: "#6b7280",
  outlineHover: "#94a3b8",
  glow: "#7c8798",
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
  metrics: RackMetrics
  items: { position: [number, number, number]; status: Item3D["status"] }[]
}

function RackItems({ metrics, items }: RackItemsProps) {
  if (items.length === 0) {
    return null
  }

  const groupedByStatus = useMemo(() => {
    const grouped: Record<ItemStatus, [number, number, number][]> = {
      normal: [],
      expired: [],
      dangerous: [],
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
          <Instances key={`occupied-${status}`} limit={positions.length}>
            <boxGeometry
              args={[
                metrics.slotSize.w,
                metrics.slotSize.h,
                metrics.slotSize.d,
              ]}
            />
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
  tone?: RackTone
}

export function RackStructure({
  rack,
  metrics,
  hovered = false,
  showItems = true,
  tone,
}: RackStructureProps) {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const resolvedTone = tone ?? DEFAULT_RACK_TONE

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
      <RackFrame
        hovered={hovered}
        metrics={resolvedMetrics}
        shelfPositions={shelfPositions}
        tone={resolvedTone}
      />
      {showItems && (
        <RackItems items={occupiedSlots} metrics={resolvedMetrics} />
      )}
    </>
  )
}
