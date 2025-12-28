import { Instance, Instances } from "@react-three/drei"
import { useMemo } from "react"
import type { Item3D, Rack3D } from "../types"
import { getItemColor } from "../types"

interface ItemsInstancedProps {
  rack: Rack3D
}

export function ItemsInstanced({ rack }: ItemsInstancedProps) {
  const { itemInstances } = useMemo(() => {
    const instances: { position: [number, number, number]; item: Item3D }[] = []

    for (let row = 0; row < rack.grid.rows; row++) {
      for (let col = 0; col < rack.grid.cols; col++) {
        const index = row * rack.grid.cols + col
        const item = rack.items[index]

        if (!item) {
          continue
        }

        const x =
          col * (rack.cell.w + rack.spacing.x) -
          (rack.grid.cols * (rack.cell.w + rack.spacing.x)) / 2
        const y =
          (rack.grid.rows - 1 - row) * (rack.cell.h + rack.spacing.y) -
          (rack.grid.rows * (rack.cell.h + rack.spacing.y)) / 2
        const z = rack.cell.d / 2

        instances.push({ position: [x, y, z], item })
      }
    }

    return { itemInstances: instances }
  }, [rack])

  return (
    <group
      position={rack.transform.position}
      rotation={[0, rack.transform.rotationY, 0]}
    >
      <Instances limit={itemInstances.length}>
        <boxGeometry
          args={[rack.cell.w * 0.8, rack.cell.h * 0.8, rack.cell.d * 0.5]}
        />
        <meshStandardMaterial />
        {itemInstances.map(({ position, item }, i) => {
          const color = getItemColor(item.status)

          return <Instance color={color} key={i} position={position} />
        })}
      </Instances>
    </group>
  )
}
