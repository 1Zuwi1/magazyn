import { ContactShadows, Grid, Line } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import { CameraController } from "./components/camera-controls"
import { ItemsFocus } from "./components/items-focus"
import { getRackMetrics, RackStructure } from "./components/rack-structure"
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
const focusFloorPadding = 0.6
const aisleExplodeOffset = 0.45
const aisleSnap = 0.2
const aislePadding = 0.5

const floorColor = "#111827"
const gridCellColor = "#1f2937"
const gridSectionColor = "#334155"
const aisleLineColor = "#fbbf24"
const aisleLineOpacity = 0.45
const fogColor = "#0f172a"

interface RackRender {
  rack: Rack3D
  renderPosition: [number, number, number]
  aisleIndex: number
}

interface AisleLayout {
  index: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  centerX: number
  centerZ: number
}

interface WarehouseLayout {
  renderRacks: RackRender[]
  aisles: AisleLayout[]
  bounds: {
    centerX: number
    centerZ: number
    width: number
    depth: number
  }
}

function getAisleKey(z: number): number {
  return Math.round(z / aisleSnap) * aisleSnap
}

function buildWarehouseLayout(racks: Rack3D[]): WarehouseLayout {
  if (racks.length === 0) {
    return {
      renderRacks: [],
      aisles: [],
      bounds: {
        centerX: 0,
        centerZ: 0,
        width: 10,
        depth: 10,
      },
    }
  }

  const racksByKey = new Map<number, Rack3D[]>()

  for (const rack of racks) {
    const key = getAisleKey(rack.transform.position[2])
    const group = racksByKey.get(key)
    if (group) {
      group.push(rack)
    } else {
      racksByKey.set(key, [rack])
    }
  }

  const sortedKeys = Array.from(racksByKey.keys()).sort((a, b) => a - b)
  const aisleIndexByKey = new Map<number, number>()

  for (const [index, key] of sortedKeys.entries()) {
    aisleIndexByKey.set(key, index)
  }

  const renderRacks: RackRender[] = []
  const aisleBounds = new Map<
    number,
    { minX: number; maxX: number; minZ: number; maxZ: number }
  >()

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const rack of racks) {
    const metrics = getRackMetrics(rack)
    const key = getAisleKey(rack.transform.position[2])
    const aisleIndex = aisleIndexByKey.get(key) ?? 0
    const offsetZ = aisleIndex * aisleExplodeOffset
    const [x, y, z] = rack.transform.position
    const renderPosition: [number, number, number] = [x, y, z + offsetZ]
    const width = metrics.width + rackOutlinePadding
    const depth = metrics.depth + rackOutlinePadding
    const rackMinX = renderPosition[0] - width / 2
    const rackMaxX = renderPosition[0] + width / 2
    const rackMinZ = renderPosition[2] - depth / 2
    const rackMaxZ = renderPosition[2] + depth / 2

    minX = Math.min(minX, rackMinX)
    maxX = Math.max(maxX, rackMaxX)
    minZ = Math.min(minZ, rackMinZ)
    maxZ = Math.max(maxZ, rackMaxZ)

    const current = aisleBounds.get(aisleIndex) ?? {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    }
    current.minX = Math.min(current.minX, rackMinX)
    current.maxX = Math.max(current.maxX, rackMaxX)
    current.minZ = Math.min(current.minZ, rackMinZ)
    current.maxZ = Math.max(current.maxZ, rackMaxZ)
    aisleBounds.set(aisleIndex, current)

    renderRacks.push({
      rack,
      renderPosition,
      aisleIndex,
    })
  }

  const aisles = Array.from(aisleBounds.entries())
    .sort(([a], [b]) => a - b)
    .map(([index, bounds]) => {
      const minX = bounds.minX - aislePadding
      const maxX = bounds.maxX + aislePadding
      const minZ = bounds.minZ - aislePadding
      const maxZ = bounds.maxZ + aislePadding

      return {
        index,
        minX,
        maxX,
        minZ,
        maxZ,
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2,
      }
    })

  return {
    renderRacks,
    aisles,
    bounds: {
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: Math.max(1, maxX - minX + floorPadding * 2),
      depth: Math.max(1, maxZ - minZ + floorPadding * 2),
    },
  }
}

export function WarehouseScene({
  warehouse,
  mode,
  selectedRackId,
}: WarehouseSceneProps) {
  const layout = useMemo(
    () => buildWarehouseLayout(warehouse.racks),
    [warehouse.racks]
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
  const shadowBounds = Math.max(floorBounds.width, floorBounds.depth)
  const fogNear = Math.max(6, floorBounds.depth * 0.35)
  const fogFar = Math.max(16, floorBounds.depth * 0.95)

  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 50 }}
      className="h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      gl={{ alpha: true, antialias: true }}
      shadows
    >
      {mode === "overview" && (
        <fog args={[fogColor, fogNear, fogFar]} attach="fog" />
      )}
      <ambientLight intensity={0.35} />
      <hemisphereLight
        groundColor="#0f172a"
        intensity={0.45}
        skyColor="#64748b"
      />
      <directionalLight
        castShadow
        intensity={1}
        position={[12, 12, 6]}
        shadow-bias={-0.0006}
        shadow-camera-bottom={-shadowBounds}
        shadow-camera-far={40}
        shadow-camera-left={-shadowBounds}
        shadow-camera-near={1}
        shadow-camera-right={shadowBounds}
        shadow-camera-top={shadowBounds}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <CameraController mode={mode} warehouseCenter={sceneCenter} />
      {mode === "overview" && (
        <group>
          <mesh
            position={[floorBounds.centerX, -floorOffset, floorBounds.centerZ]}
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[floorBounds.width, floorBounds.depth]} />
            <meshStandardMaterial
              color={floorColor}
              metalness={0.05}
              roughness={0.9}
            />
          </mesh>
          <Grid
            args={[floorBounds.width, floorBounds.depth]}
            cellColor={gridCellColor}
            cellSize={0.5}
            cellThickness={0.6}
            fadeDistance={Math.max(floorBounds.width, floorBounds.depth)}
            fadeStrength={1}
            position={[
              floorBounds.centerX,
              -floorOffset + 0.002,
              floorBounds.centerZ,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            sectionColor={gridSectionColor}
            sectionSize={2}
            sectionThickness={1}
          />
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
          <ContactShadows
            blur={2.2}
            color="#0b1220"
            frames={1}
            height={floorBounds.depth}
            opacity={0.25}
            position={[
              floorBounds.centerX,
              -floorOffset + 0.005,
              floorBounds.centerZ,
            ]}
            resolution={1024}
            width={floorBounds.width}
          />
        </group>
      )}
      {mode === "overview" && <RacksOverview racks={layout.renderRacks} />}
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
                <mesh
                  position={[0, -metrics.height / 2 - floorOffset, 0]}
                  receiveShadow
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry
                    args={[
                      metrics.width + focusFloorPadding * 2,
                      metrics.depth + focusFloorPadding * 2,
                    ]}
                  />
                  <meshStandardMaterial
                    color={floorColor}
                    metalness={0.05}
                    roughness={0.9}
                  />
                </mesh>
                <Grid
                  args={[
                    metrics.width + focusFloorPadding * 2,
                    metrics.depth + focusFloorPadding * 2,
                  ]}
                  cellColor={gridCellColor}
                  cellSize={0.3}
                  cellThickness={0.6}
                  position={[0, -metrics.height / 2 - floorOffset + 0.002, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  sectionColor={gridSectionColor}
                  sectionSize={1.5}
                  sectionThickness={1}
                />
                <ContactShadows
                  blur={1.8}
                  color="#0b1220"
                  frames={1}
                  height={metrics.depth + focusFloorPadding * 2}
                  opacity={0.28}
                  position={[0, -metrics.height / 2 - floorOffset + 0.005, 0]}
                  resolution={512}
                  width={metrics.width + focusFloorPadding * 2}
                />
                <RackStructure
                  metrics={metrics}
                  rack={rackAtOrigin}
                  showItems={false}
                />
                <ItemsFocus
                  applyTransform={false}
                  metrics={metrics}
                  rack={rackAtOrigin}
                />
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
