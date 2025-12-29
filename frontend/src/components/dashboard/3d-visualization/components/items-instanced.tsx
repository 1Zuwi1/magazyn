import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { ItemStatus, Rack3D } from "../types"
import { getItemVisuals, ITEM_STATUS_ORDER } from "../types"

interface ItemsInstancedProps {
  rack: Rack3D
}

export function ItemsInstanced({ rack }: ItemsInstancedProps) {
  const { itemsByStatus } = useMemo(() => {
    const grouped: Record<ItemStatus, [number, number, number][]> = {
      normal: [],
      dangerous: [],
      expired: [],
      "expired-dangerous": [],
    }
    const unitX = rack.cell.w + rack.spacing.x
    const unitY = rack.cell.h + rack.spacing.y
    const gridWidth = Math.max(0, rack.grid.cols - 1) * unitX
    const gridHeight = Math.max(0, rack.grid.rows - 1) * unitY

    for (let row = 0; row < rack.grid.rows; row++) {
      for (let col = 0; col < rack.grid.cols; col++) {
        const index = row * rack.grid.cols + col
        const item = rack.items[index]

        if (!item) {
          continue
        }

        const x = col * unitX - gridWidth / 2
        const y = (rack.grid.rows - 1 - row) * unitY - gridHeight / 2
        const z = rack.cell.d / 2

        grouped[item.status].push([x, y, z])
      }
    }

    return { itemsByStatus: grouped }
  }, [rack])

  return (
    <group
      position={rack.transform.position}
      rotation={[0, rack.transform.rotationY, 0]}
    >
      {ITEM_STATUS_ORDER.map((status) => {
        const positions = itemsByStatus[status]
        if (!positions || positions.length === 0) {
          return null
        }
        const visuals = getItemVisuals(status)

        return (
          <Instances
            frustumCulled={false}
            key={`items-${status}`}
            limit={positions.length}
          >
            <boxGeometry
              args={[rack.cell.w * 0.8, rack.cell.h * 0.8, rack.cell.d * 0.5]}
            />
            <meshStandardMaterial
              color={visuals.color}
              emissive={visuals.glow}
              emissiveIntensity={visuals.emissiveIntensity}
              metalness={0.08}
              roughness={0.75}
            />
            {positions.map((position, index) => (
              <Instance key={`item-${status}-${index}`} position={position} />
            ))}
          </Instances>
        )
      })}
    </group>
  )
}
