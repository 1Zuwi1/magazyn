import { Edges } from "@react-three/drei"
import { useMemo } from "react"
import type { Rack3D } from "../types"
import { getDisplaySize, getOccupiedSlots, RackItems } from "./rack-items"
import { getRackMetrics, type RackMetrics } from "./rack-metrics"
import { getShelfPositionsForGrid } from "./rack-shelves"
import { DEFAULT_RACK_TONE, type RackTone } from "./rack-tone"

interface RackFrameProps {
  metrics: RackMetrics
  shelfPositions: number[]
  hovered: boolean
  tone: RackTone
}

function RackFrame({ metrics, shelfPositions, hovered, tone }: RackFrameProps) {
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
        <mesh key={`post-${index}`} position={position}>
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
        <mesh key={`beam-x-${index}`} position={position}>
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
        <mesh key={`beam-z-${index}`} position={position}>
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
        <mesh key={`shelf-${index}`} position={[0, y, 0]}>
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
    const displaySize = getDisplaySize(rack, resolvedMetrics)
    const shelves = showShelves
      ? getShelfPositionsForGrid({
          rows: displaySize.displayRows,
          unitY: displaySize.displayUnitY,
          gridHeight: resolvedMetrics.gridHeight,
          cellHeight: rack.cell.h,
          shelfThickness: resolvedMetrics.shelfThickness,
          rackHeight: resolvedMetrics.height,
        })
      : []

    if (!showItems) {
      return {
        occupiedSlots: [],
        shelfPositions: shelves,
        slotSize: displaySize.displaySlotSize,
      }
    }

    return {
      occupiedSlots: getOccupiedSlots(rack, resolvedMetrics, displaySize),
      shelfPositions: shelves,
      slotSize: displaySize.displaySlotSize,
    }
  }, [showItems, showShelves, rack, resolvedMetrics])

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
