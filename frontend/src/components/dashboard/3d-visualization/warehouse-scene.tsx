import { Canvas } from "@react-three/fiber"
import { CameraController } from "./components/camera-controls"
import { ItemsInstanced } from "./components/items-instanced"
import { RacksOverview } from "./components/racks-overview"
import { ShelvesInstanced } from "./components/shelves-instanced"
import type { Rack3D, ViewMode, Warehouse3D } from "./types"

interface WarehouseSceneProps {
  warehouse: Warehouse3D
  mode: ViewMode
  selectedRackId: string | null
}

export function WarehouseScene({
  warehouse,
  mode,
  selectedRackId,
}: WarehouseSceneProps) {
  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={0.8} position={[10, 10, 5]} />
      <CameraController mode={mode} warehouseCenter={warehouse.center} />
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
            return (
              <group key={rack.id}>
                <ShelvesInstanced rack={rackAtOrigin} />
                <ItemsInstanced rack={rackAtOrigin} />
              </group>
            )
          })}
    </Canvas>
  )
}
