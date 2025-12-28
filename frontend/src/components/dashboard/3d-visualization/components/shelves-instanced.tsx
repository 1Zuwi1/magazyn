import { Instance, Instances, useCursor } from "@react-three/drei"
import { useMemo, useState } from "react"
import { useWarehouseStore } from "../store"
import type { Rack3D } from "../types"
import { fromIndex } from "../types"
import { getRackMetrics, type RackMetrics } from "./rack-structure"

const HOVER_COLOR = "#60a5fa"
const SELECTED_COLOR = "#3b82f6"
const HIGHLIGHT_OPACITY = 0.35

interface ShelvesInstancedProps {
  rack: Rack3D
  metrics?: RackMetrics
  applyTransform?: boolean
}

export function ShelvesInstanced({
  rack,
  metrics,
  applyTransform = true,
}: ShelvesInstancedProps) {
  const { selectedShelf, hoverShelf, selectShelf } = useWarehouseStore()
  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(
    null
  )
  const resolvedMetrics = metrics ?? getRackMetrics(rack)

  const { instancePositions, instanceToIndex, indexToInstance, totalCount } =
    useMemo(() => {
      const positions: [number, number, number][] = []
      const instanceMap: Record<number, number> = {}
      const indexMap: Record<number, number> = {}
      let idx = 0

      for (let row = 0; row < rack.grid.rows; row++) {
        const y =
          (rack.grid.rows - 1 - row) * resolvedMetrics.unitY -
          resolvedMetrics.gridHeight / 2

        for (let col = 0; col < rack.grid.cols; col++) {
          const x = col * resolvedMetrics.unitX - resolvedMetrics.gridWidth / 2
          const shelfIndex = row * rack.grid.cols + col

          positions.push([x, y, 0])
          instanceMap[idx] = shelfIndex
          indexMap[shelfIndex] = idx
          idx++
        }
      }

      return {
        instancePositions: positions,
        instanceToIndex: instanceMap,
        indexToInstance: indexMap,
        totalCount: idx,
      }
    }, [
      rack.grid.cols,
      rack.grid.rows,
      resolvedMetrics.gridHeight,
      resolvedMetrics.gridWidth,
      resolvedMetrics.unitX,
      resolvedMetrics.unitY,
    ])

  useCursor(hoveredInstanceId !== null)

  const selected =
    selectedShelf?.rackId === rack.id && selectedShelf?.index !== undefined
  const selectedInstanceId =
    selected && selectedShelf ? indexToInstance[selectedShelf.index] ?? null : null

  const highlightInstances = useMemo(() => {
    const highlights: { position: [number, number, number]; color: string }[] =
      []

    if (selectedInstanceId !== null) {
      const position = instancePositions[selectedInstanceId]
      if (position) {
        highlights.push({ position, color: SELECTED_COLOR })
      }
    }

    if (
      hoveredInstanceId !== null &&
      hoveredInstanceId !== selectedInstanceId
    ) {
      const position = instancePositions[hoveredInstanceId]
      if (position) {
        highlights.push({ position, color: HOVER_COLOR })
      }
    }

    return highlights
  }, [hoveredInstanceId, selectedInstanceId, instancePositions])

  const groupProps = applyTransform
    ? {
        position: rack.transform.position,
        rotation: [0, rack.transform.rotationY, 0] as [number, number, number],
      }
    : {}

  return (
    <group {...groupProps}>
      <Instances limit={totalCount}>
        <boxGeometry args={[rack.cell.w, rack.cell.h, rack.cell.d]} />
        <meshStandardMaterial depthWrite={false} opacity={0} transparent />
        {instancePositions.map((position, i) => (
          <Instance
            key={`slot-${i}`}
            onClick={(e) => {
              e.stopPropagation()
              const shelfIndex = instanceToIndex[i]
              selectShelf(rack.id, shelfIndex, rack.grid.cols)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHoveredInstanceId(null)
              hoverShelf(null)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredInstanceId(i)
              const shelfIndex = instanceToIndex[i]
              const { row, col } = fromIndex(shelfIndex, rack.grid.cols)
              hoverShelf({ rackId: rack.id, index: shelfIndex, row, col })
            }}
            position={position}
          />
        ))}
      </Instances>
      {highlightInstances.length > 0 && (
        <Instances limit={highlightInstances.length} raycast={() => null}>
          <boxGeometry args={[rack.cell.w, rack.cell.h, rack.cell.d]} />
          <meshStandardMaterial
            depthWrite={false}
            opacity={HIGHLIGHT_OPACITY}
            transparent
          />
          {highlightInstances.map(({ position, color }, index) => (
            <Instance
              color={color}
              key={`highlight-${index}`}
              position={position}
            />
          ))}
        </Instances>
      )}
    </group>
  )
}
