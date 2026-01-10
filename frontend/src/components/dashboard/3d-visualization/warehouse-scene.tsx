import { Line } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import { CameraController } from "./components/camera-controls"
import { RackFocusView } from "./components/rack-focus-view"
import { getRackMetrics } from "./components/rack-metrics"
import { RacksOverview } from "./components/racks-overview"
import { VISUALIZATION_CONSTANTS } from "./constants"
import { useWarehouseStore } from "./store"
import type { Rack3D, ViewMode, Warehouse3D } from "./types"
import { buildWarehouseLayout } from "./warehouse-layout"

interface WarehouseSceneProps {
  warehouse: Warehouse3D
  mode: ViewMode
  selectedRackId: string | null
}

const {
  LAYOUT: { floorOffset, focusFloorPadding },
  COLORS: { floor: floorColor, aisleLine: aisleLineColor, fog: fogColor },
  OPACITY: { aisleLine: aisleLineOpacity },
} = VISUALIZATION_CONSTANTS

export function WarehouseScene({
  warehouse,
  mode,
  selectedRackId,
}: WarehouseSceneProps) {
  const focusWindow = useWarehouseStore((state) => state.focusWindow)
  const rackMetricsById = useMemo(() => {
    const metricsById = new Map<string, ReturnType<typeof getRackMetrics>>()
    for (const rack of warehouse.racks) {
      metricsById.set(rack.id, getRackMetrics(rack))
    }
    return metricsById
  }, [warehouse.racks])
  const layout = useMemo(
    () => buildWarehouseLayout(warehouse.racks, rackMetricsById),
    [warehouse.racks, rackMetricsById]
  )
  const floorBounds = layout.bounds
  const sceneCenter = useMemo(
    () => ({
      x: floorBounds.centerX,
      y: 0,
      z: floorBounds.centerZ,
    }),
    [floorBounds.centerX, floorBounds.centerZ]
  )
  const fogNear = Math.max(8, floorBounds.depth * 0.35)
  const fogFar = Math.max(22, floorBounds.depth * 0.95)

  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 50 }}
      className="h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      gl={{ alpha: true, antialias: true }}
    >
      {mode === "overview" && (
        <fog args={[fogColor, fogNear, fogFar]} attach="fog" />
      )}
      <ambientLight intensity={0.35} />
      <hemisphereLight
        color="#64748b"
        groundColor={fogColor}
        intensity={0.45}
      />
      <directionalLight intensity={1} position={[12, 12, 6]} />
      <CameraController mode={mode} warehouseCenter={sceneCenter} />
      {mode === "overview" && (
        <group>
          <mesh
            position={[floorBounds.centerX, -floorOffset, floorBounds.centerZ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[floorBounds.width, floorBounds.depth]} />
            <meshStandardMaterial
              color={floorColor}
              metalness={0.05}
              roughness={0.9}
            />
          </mesh>
          {layout.aisles.map((aisle) => (
            <group key={`aisle-${aisle.index}`}>
              <Line
                color={aisleLineColor}
                lineWidth={1}
                opacity={aisleLineOpacity}
                points={[
                  [aisle.minX, -floorOffset + 0.004, aisle.minZ],
                  [aisle.maxX, -floorOffset + 0.004, aisle.minZ],
                  [aisle.maxX, -floorOffset + 0.004, aisle.maxZ],
                  [aisle.minX, -floorOffset + 0.004, aisle.maxZ],
                  [aisle.minX, -floorOffset + 0.004, aisle.minZ],
                ]}
                transparent
              />
            </group>
          ))}
        </group>
      )}
      {mode === "overview" && <RacksOverview racks={layout.renderRacks} />}
      {mode === "focus" &&
        selectedRackId &&
        warehouse.racks
          .filter((rack: Rack3D) => rack.id === selectedRackId)
          .map((rack: Rack3D) => (
            <RackFocusView
              floorOffset={floorOffset}
              floorPadding={focusFloorPadding}
              focusWindow={focusWindow}
              key={rack.id}
              rack={rack}
            />
          ))}
    </Canvas>
  )
}
