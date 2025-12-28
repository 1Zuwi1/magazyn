import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import { CameraController } from "./components/camera-controls"
import { RackStructure, getRackMetrics } from "./components/rack-structure"
import { RacksOverview } from "./components/racks-overview"
import { ShelvesInstanced } from "./components/shelves-instanced"
import type { Rack3D, ViewMode, Warehouse3D } from "./types"

interface WarehouseSceneProps {
  warehouse: Warehouse3D
  mode: ViewMode
  selectedRackId: string | null
}

const rackOutlinePadding = 0.2
const floorPadding = 0.6
const floorOffset = 0.01

function getWarehouseBounds(racks: Rack3D[]): {
  centerX: number
  centerZ: number
  width: number
  depth: number
} {
  if (racks.length === 0) {
    return {
      centerX: 0,
      centerZ: 0,
      width: 10,
      depth: 10,
    }
  }

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const rack of racks) {
    const width =
      rack.grid.cols * (rack.cell.w + rack.spacing.x) + rackOutlinePadding
    const depth = rack.cell.d + rackOutlinePadding
    const x = rack.transform.position[0]
    const z = rack.transform.position[2]

    minX = Math.min(minX, x - width / 2)
    maxX = Math.max(maxX, x + width / 2)
    minZ = Math.min(minZ, z - depth / 2)
    maxZ = Math.max(maxZ, z + depth / 2)
  }

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: Math.max(1, maxX - minX + floorPadding * 2),
    depth: Math.max(1, maxZ - minZ + floorPadding * 2),
  }
}

export function WarehouseScene({
  warehouse,
  mode,
  selectedRackId,
}: WarehouseSceneProps) {
  const floorBounds = useMemo(
    () => getWarehouseBounds(warehouse.racks),
    [warehouse.racks]
  )

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={0.8} position={[10, 10, 5]} />
      <CameraController mode={mode} warehouseCenter={warehouse.center} />
      {mode === "overview" && (
        <mesh
          position={[floorBounds.centerX, -floorOffset, floorBounds.centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[floorBounds.width, floorBounds.depth]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      )}
      {mode === "overview" && <RacksOverview racks={warehouse.racks} />}
      {mode === "focus" &&
        selectedRackId &&
        warehouse.racks
          .filter((rack: Rack3D) => rack.id === selectedRackId)
          .map((rack: Rack3D) => {
            const rackAtOrigin = {
              ...rack,
              transform: {
                ...rack.transform,
                position: [0, 0, 0] as [number, number, number],
              },
            }
            const metrics = getRackMetrics(rackAtOrigin)
            return (
              <group
                key={rack.id}
                position={rackAtOrigin.transform.position}
                rotation={[0, rackAtOrigin.transform.rotationY, 0]}
              >
                <RackStructure metrics={metrics} rack={rackAtOrigin} />
                <ShelvesInstanced
                  applyTransform={false}
                  metrics={metrics}
                  rack={rackAtOrigin}
                />
              </group>
            )
          })}
    </Canvas>
  )
}
