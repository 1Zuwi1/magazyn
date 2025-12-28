import { Instance, Instances, useCursor } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { useWarehouseStore } from "../store"
import type { Item3D, Rack3D } from "../types"
import { fromIndex } from "../types"

function getShelfColor(
  item: Item3D | null | undefined,
  isHovered: boolean,
  isSelected: boolean
): string {
  if (isSelected) {
    return "#3b82f6"
  }
  if (isHovered) {
    return "#60a5fa"
  }
  if (item) {
    return "#f1f5f9"
  }
  return "#e2e8f0"
}

interface ShelvesInstancedProps {
  rack: Rack3D
}

export function ShelvesInstanced({ rack }: ShelvesInstancedProps) {
  const { selectedShelf, hoverShelf, selectShelf } = useWarehouseStore()
  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(
    null
  )

  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { instancePositions, instanceToIndex, totalCount } = useMemo(() => {
    const positions: [number, number, number][] = []
    const indexMap: Record<number, number> = {}
    let idx = 0

    for (let row = 0; row < rack.grid.rows; row++) {
      for (let col = 0; col < rack.grid.cols; col++) {
        const x =
          col * (rack.cell.w + rack.spacing.x) -
          (rack.grid.cols * (rack.cell.w + rack.spacing.x)) / 2
        const y =
          (rack.grid.rows - 1 - row) * (rack.cell.h + rack.spacing.y) -
          (rack.grid.rows * (rack.cell.h + rack.spacing.y)) / 2
        const z = 0

        positions.push([x, y, z])
        indexMap[idx] = row * rack.grid.cols + col
        idx++
      }
    }

    return {
      instancePositions: positions,
      instanceToIndex: indexMap,
      totalCount: idx,
    }
  }, [rack])

  useCursor(hoveredInstanceId !== null)

  const selected =
    selectedShelf?.rackId === rack.id && selectedShelf?.index !== undefined

  useFrame(() => {
    if (!meshRef.current) {
      return
    }

    const color = new THREE.Color()
    for (let i = 0; i < totalCount; i++) {
      const shelfIndex = instanceToIndex[i]
      const isHovered = hoveredInstanceId === i
      const isSelected = selected && selectedShelf?.index === shelfIndex
      const item = rack.items[shelfIndex]

      const colorHex = getShelfColor(item, isHovered, isSelected)
      color.set(colorHex)

      meshRef.current.setColorAt(i, color)
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <group
      position={rack.transform.position}
      rotation={[0, rack.transform.rotationY, 0]}
    >
      <Instances limit={totalCount} ref={meshRef}>
        <boxGeometry args={[rack.cell.w, rack.cell.h, rack.cell.d]} />
        <meshStandardMaterial />
        {instancePositions.map((position, i) => (
          <Instance
            color="#e2e8f0"
            key={i}
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
    </group>
  )
}
