import { Html } from "@react-three/drei"
import { useState } from "react"
import { useWarehouseStore } from "../store"
import type { Rack3D } from "../types"
import { getOccupancyColor } from "../types"

interface RackInstanceProps {
  rack: Rack3D
  onFocus: (rackId: string) => void
}

function RackInstance({ rack, onFocus }: RackInstanceProps) {
  const [hovered, setHovered] = useState(false)
  const occupiedCount = rack.items.filter((item) => item !== null).length
  const occupancy = (occupiedCount / (rack.grid.rows * rack.grid.cols)) * 100
  const color = getOccupancyColor(occupancy)

  return (
    <group
      position={rack.transform.position}
      rotation={[0, rack.transform.rotationY, 0]}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Three.js mesh */}
      <mesh
        onClick={() => {
          onFocus(rack.id)
        }}
        onPointerOut={() => {
          setHovered(false)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
      >
        <boxGeometry
          args={[
            rack.grid.cols * (rack.cell.w + rack.spacing.x) + 0.2,
            rack.grid.rows * (rack.cell.h + rack.spacing.y) + 0.2,
            rack.cell.d + 0.2,
          ]}
        />
        <meshStandardMaterial
          color={color}
          opacity={hovered ? 0.9 : 0.7}
          transparent
        />
      </mesh>
      <Html
        center
        distanceFactor={10}
        position={[
          0,
          (rack.grid.rows * (rack.cell.h + rack.spacing.y)) / 2 + 0.5,
          0,
        ]}
      >
        <div className="rounded bg-black/70 px-2 py-1 text-white text-xs">
          <div className="font-bold">{rack.code}</div>
          <div>
            {Math.round(occupancy)}% zajęte • {rack.grid.cols}×{rack.grid.rows}
          </div>
          <div className="text-slate-300">
            Maks: {rack.maxElementSize.width}×{rack.maxElementSize.height}×
            {rack.maxElementSize.depth}cm
          </div>
        </div>
      </Html>
    </group>
  )
}

interface RacksOverviewProps {
  racks: Rack3D[]
}

export function RacksOverview({ racks }: RacksOverviewProps) {
  const focusRack = useWarehouseStore((state) => state.focusRack)

  return (
    <group>
      {racks.map((rack) => (
        <RackInstance key={rack.id} onFocus={focusRack} rack={rack} />
      ))}
    </group>
  )
}
