import { Instance, Instances, useCursor } from "@react-three/drei"
import { useMemo, useState } from "react"
import { VISUALIZATION_CONSTANTS } from "../constants"
import { useWarehouseStore } from "../store"
import type { FocusWindow, Rack3D } from "../types"
import {
  getGridDimensions,
  getRackMetrics,
  type RackMetrics,
} from "./rack-metrics"

const {
  COLORS: { hover: HOVER_COLOR, selected: SELECTED_COLOR },
  OPACITY: { shelfHighlight: HIGHLIGHT_OPACITY },
} = VISUALIZATION_CONSTANTS

interface ShelvesInstancedProps {
  rack: Rack3D
  metrics?: RackMetrics
  applyTransform?: boolean
  window?: FocusWindow | null
}

export function ShelvesInstanced({
  rack,
  metrics,
  applyTransform = true,
  window,
}: ShelvesInstancedProps) {
  const { selectedShelf, hoverShelf, selectShelf } = useWarehouseStore()
  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(
    null
  )
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const activeWindow = window?.rackId === rack.id ? window : null

  const { instancePositions, instanceMeta, indexToInstance, totalCount } =
    useMemo(() => {
      const positions: [number, number, number][] = []
      const meta: { index: number; row: number; col: number }[] = []
      const indexMap: Record<number, number> = {}
      const startRow = activeWindow?.startRow ?? 0
      const startCol = activeWindow?.startCol ?? 0
      const rows = activeWindow?.rows ?? rack.grid.rows
      const cols = activeWindow?.cols ?? rack.grid.cols
      const { width: windowGridWidth, height: windowGridHeight } =
        getGridDimensions(
          cols,
          rows,
          resolvedMetrics.unitX,
          resolvedMetrics.unitY
        )
      let idx = 0

      for (let row = 0; row < rows; row++) {
        const globalRow = startRow + row
        const y =
          (rows - 1 - row) * resolvedMetrics.unitY - windowGridHeight / 2

        for (let col = 0; col < cols; col++) {
          const globalCol = startCol + col
          const x = col * resolvedMetrics.unitX - windowGridWidth / 2
          const shelfIndex = globalRow * rack.grid.cols + globalCol

          positions.push([x, y, 0])
          meta.push({ index: shelfIndex, row: globalRow, col: globalCol })
          indexMap[shelfIndex] = idx
          idx++
        }
      }

      return {
        instancePositions: positions,
        instanceMeta: meta,
        indexToInstance: indexMap,
        totalCount: idx,
      }
    }, [
      activeWindow?.cols,
      activeWindow?.rows,
      activeWindow?.startCol,
      activeWindow?.startRow,
      rack.grid.cols,
      rack.grid.rows,
      resolvedMetrics.unitX,
      resolvedMetrics.unitY,
    ])

  useCursor(hoveredInstanceId !== null)

  const selected =
    selectedShelf?.rackId === rack.id && selectedShelf.index !== null
  const selectedInstanceId =
    selected && selectedShelf
      ? (indexToInstance[selectedShelf.index] ?? null)
      : null

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
      <Instances frustumCulled={false} limit={totalCount}>
        <boxGeometry args={[rack.cell.w, rack.cell.h, rack.cell.d]} />
        <meshStandardMaterial depthWrite={false} opacity={0} transparent />
        {instancePositions.map((position, i) => (
          <Instance
            key={`slot-${i}`}
            onClick={(e) => {
              e.stopPropagation()
              const meta = instanceMeta[i]
              if (!meta) {
                return
              }
              selectShelf(rack.id, meta.index, meta.row, meta.col)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHoveredInstanceId(null)
              hoverShelf(null)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredInstanceId(i)
              const meta = instanceMeta[i]
              if (!meta) {
                return
              }
              hoverShelf({
                rackId: rack.id,
                index: meta.index,
                row: meta.row,
                col: meta.col,
              })
            }}
            position={position}
          />
        ))}
      </Instances>
      {highlightInstances.length > 0 && (
        <Instances
          frustumCulled={false}
          limit={highlightInstances.length}
          raycast={() => null}
        >
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
