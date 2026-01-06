import { ContactShadows, Edges, Grid, Line } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import { BlocksInstanced, getBlockLayout } from "./components/blocks-instanced"
import { CameraController } from "./components/camera-controls"
import { ItemsFocus } from "./components/items-focus"
import {
  getRackMetrics,
  getShelfPositionsForGrid,
  RackShelves,
  RackStructure,
} from "./components/rack-structure"
import { RacksOverview } from "./components/racks-overview"
import { ShelvesInstanced } from "./components/shelves-instanced"
import { useWarehouseStore } from "./store"
import type { FocusWindow, Rack3D, ViewMode, Warehouse3D } from "./types"
import { RACK_ZONE_SIZE } from "./types"

interface WarehouseSceneProps {
  warehouse: Warehouse3D
  mode: ViewMode
  selectedRackId: string | null
}

const rackOutlinePadding = 0.2
const rackLayoutGap = 0.4
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

type RackMetricsById = Map<string, ReturnType<typeof getRackMetrics>>

interface RackFocusViewProps {
  rack: Rack3D
  focusWindow: FocusWindow | null
  floorOffset: number
  floorPadding: number
}

interface RackFocusMetrics {
  rackAtOrigin: Rack3D
  metrics: ReturnType<typeof getRackMetrics>
  isLargeGrid: boolean
  activeWindow: FocusWindow | null
  blockLayout: ReturnType<typeof getBlockLayout> | null
  windowMetrics: ReturnType<typeof getRackMetrics> | null
  showBlockGrid: boolean
  focusWidth: number
  focusHeight: number
  focusDepth: number
  focusFloorY: number
  blockShelfPositions: number[] | null
  windowShelfPositions: number[] | null
}

function getRackAtOrigin(rack: Rack3D): Rack3D {
  return {
    ...rack,
    transform: {
      ...rack.transform,
      position: [0, 0, 0] as [number, number, number],
    },
  }
}

function isLargeGrid(rack: Rack3D): boolean {
  return rack.grid.rows > RACK_ZONE_SIZE || rack.grid.cols > RACK_ZONE_SIZE
}

function getActiveWindow(
  rack: Rack3D,
  focusWindow: FocusWindow | null
): FocusWindow | null {
  return focusWindow && focusWindow.rackId === rack.id ? focusWindow : null
}

function getWindowMetrics(activeWindow: FocusWindow, rackAtOrigin: Rack3D) {
  return getRackMetrics({
    ...rackAtOrigin,
    grid: {
      rows: activeWindow.rows,
      cols: activeWindow.cols,
    },
  })
}

function getFocusDimensions(
  activeWindow: FocusWindow | null,
  windowMetrics: ReturnType<typeof getRackMetrics> | null,
  blockLayout: ReturnType<typeof getBlockLayout> | null,
  metrics: ReturnType<typeof getRackMetrics>
) {
  const focusWidth = activeWindow
    ? (windowMetrics?.width ?? metrics.width)
    : (blockLayout?.totalWidth ?? metrics.width)
  const focusHeight = activeWindow
    ? (windowMetrics?.height ?? metrics.height)
    : (blockLayout?.totalHeight ?? metrics.height)
  const focusDepth = activeWindow
    ? (windowMetrics?.depth ?? metrics.depth)
    : (blockLayout?.totalDepth ?? metrics.depth)
  return { focusWidth, focusHeight, focusDepth }
}

function getBlockShelfPositions(
  blockLayout: NonNullable<ReturnType<typeof getBlockLayout>>,
  metrics: ReturnType<typeof getRackMetrics>
): number[] {
  return getShelfPositionsForGrid({
    rows: blockLayout.blockRows,
    unitY: blockLayout.unitY,
    gridHeight: blockLayout.gridHeight,
    cellHeight: blockLayout.blockSizeY,
    shelfThickness: metrics.shelfThickness,
  })
}

function getWindowShelfPositions(
  activeWindow: FocusWindow,
  windowMetrics: ReturnType<typeof getRackMetrics>,
  rackAtOrigin: Rack3D
): number[] {
  return getShelfPositionsForGrid({
    rows: activeWindow.rows,
    unitY: windowMetrics.unitY,
    gridHeight: windowMetrics.gridHeight,
    cellHeight: rackAtOrigin.cell.h,
    shelfThickness: windowMetrics.shelfThickness,
  })
}

function getRackFocusMetrics(
  rack: Rack3D,
  focusWindow: FocusWindow | null
): RackFocusMetrics {
  const rackAtOrigin = getRackAtOrigin(rack)
  const metrics = getRackMetrics(rackAtOrigin)
  const largeGrid = isLargeGrid(rackAtOrigin)
  const activeWindow = getActiveWindow(rackAtOrigin, focusWindow)
  const blockLayout = largeGrid
    ? getBlockLayout(rackAtOrigin, metrics, RACK_ZONE_SIZE)
    : null
  const windowMetrics = activeWindow
    ? getWindowMetrics(activeWindow, rackAtOrigin)
    : null
  const showBlockGrid = largeGrid && !activeWindow
  const { focusWidth, focusHeight, focusDepth } = getFocusDimensions(
    activeWindow,
    windowMetrics,
    blockLayout,
    metrics
  )
  const focusFloorY = -focusHeight / 2
  const blockShelfPositions =
    showBlockGrid && blockLayout
      ? getBlockShelfPositions(blockLayout, metrics)
      : null
  const windowShelfPositions =
    activeWindow && windowMetrics
      ? getWindowShelfPositions(activeWindow, windowMetrics, rackAtOrigin)
      : null

  return {
    rackAtOrigin,
    metrics,
    isLargeGrid: largeGrid,
    activeWindow,
    blockLayout,
    windowMetrics,
    showBlockGrid,
    focusWidth,
    focusHeight,
    focusDepth,
    focusFloorY,
    blockShelfPositions,
    windowShelfPositions,
  }
}

function RackFocusView({
  rack,
  focusWindow,
  floorOffset,
  floorPadding,
}: RackFocusViewProps) {
  const {
    rackAtOrigin,
    metrics,
    showBlockGrid,
    activeWindow,
    blockLayout,
    windowMetrics,
    focusWidth,
    focusHeight,
    focusDepth,
    focusFloorY,
    blockShelfPositions,
    windowShelfPositions,
  } = getRackFocusMetrics(rack, focusWindow)
  const actualFocusFloorY = focusFloorY - floorOffset

  return (
    <group
      position={rackAtOrigin.transform.position}
      rotation={[0, rackAtOrigin.transform.rotationY, 0]}
    >
      <mesh
        position={[0, actualFocusFloorY, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[focusWidth + floorPadding * 2, focusDepth + floorPadding * 2]}
        />
        <meshStandardMaterial
          color={floorColor}
          metalness={0.05}
          roughness={0.9}
        />
      </mesh>
      <Grid
        args={[focusWidth + floorPadding * 2, focusDepth + floorPadding * 2]}
        cellColor={gridCellColor}
        cellSize={0.3}
        cellThickness={0.6}
        position={[0, actualFocusFloorY + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        sectionColor={gridSectionColor}
        sectionSize={1.5}
        sectionThickness={1}
      />
      <ContactShadows
        blur={1.8}
        color="#0b1220"
        frames={1}
        height={focusDepth + floorPadding * 2}
        opacity={0.28}
        position={[0, actualFocusFloorY + 0.005, 0]}
        resolution={512}
        width={focusWidth + floorPadding * 2}
      />
      {!(showBlockGrid || activeWindow) && (
        <RackStructure
          metrics={metrics}
          rack={rackAtOrigin}
          showItems={false}
          showShelves
        />
      )}
      {(showBlockGrid || activeWindow) && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[focusWidth, focusHeight, focusDepth]} />
          <meshStandardMaterial
            color="#94a3b8"
            depthWrite={false}
            emissive="#64748b"
            emissiveIntensity={0.08}
            opacity={0.08}
            transparent
          />
          <Edges
            color="#94a3b8"
            lineWidth={1.1}
            opacity={0.7}
            scale={1.01}
            transparent
          />
        </mesh>
      )}
      {showBlockGrid && blockLayout && blockShelfPositions && (
        <RackShelves
          depth={blockLayout.totalDepth}
          shelfPositions={blockShelfPositions}
          thickness={metrics.shelfThickness}
          width={blockLayout.totalWidth}
        />
      )}
      {showBlockGrid ? (
        <BlocksInstanced
          applyTransform={false}
          blockSize={RACK_ZONE_SIZE}
          clickable
          hoverable
          metrics={metrics}
          rack={rackAtOrigin}
        />
      ) : (
        <>
          {windowShelfPositions && windowMetrics && (
            <RackShelves
              depth={windowMetrics.depth}
              shelfPositions={windowShelfPositions}
              thickness={windowMetrics.shelfThickness}
              width={windowMetrics.width}
            />
          )}
          <ItemsFocus
            applyTransform={false}
            metrics={metrics}
            rack={rackAtOrigin}
            window={activeWindow}
          />
          <ShelvesInstanced
            applyTransform={false}
            metrics={metrics}
            rack={rackAtOrigin}
            window={activeWindow}
          />
        </>
      )}
    </group>
  )
}

function getAisleKey(z: number): number {
  return Math.round(z / aisleSnap) * aisleSnap
}

function buildWarehouseLayout(
  racks: Rack3D[],
  rackMetricsById: RackMetricsById
): WarehouseLayout {
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

  for (const key of sortedKeys) {
    const aisleIndex = aisleIndexByKey.get(key) ?? 0
    const offsetZ = aisleIndex * aisleExplodeOffset
    const aisleRacks = racksByKey.get(key) ?? []
    const sortedRacks = [...aisleRacks].sort(
      (a, b) => a.transform.position[0] - b.transform.position[0]
    )
    const rackLayouts = sortedRacks.map((rack) => {
      const metrics = rackMetricsById.get(rack.id) ?? getRackMetrics(rack)
      const isLarge =
        rack.grid.rows > RACK_ZONE_SIZE || rack.grid.cols > RACK_ZONE_SIZE
      const blockLayout = isLarge
        ? getBlockLayout(rack, metrics, RACK_ZONE_SIZE)
        : null

      return {
        rack,
        width: blockLayout?.totalWidth ?? metrics.width,
        height: blockLayout?.totalHeight ?? metrics.height,
        depth: blockLayout?.totalDepth ?? metrics.depth,
      }
    })
    const totalWidth =
      rackLayouts.reduce((sum, layout) => sum + layout.width, 0) +
      rackLayoutGap * Math.max(0, rackLayouts.length - 1)
    let currentX = -totalWidth / 2

    for (const layout of rackLayouts) {
      const renderPosition: [number, number, number] = [
        currentX + layout.width / 2,
        layout.height / 2,
        key + offsetZ,
      ]
      const width = layout.width + rackOutlinePadding
      const depth = layout.depth + rackOutlinePadding
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
        rack: layout.rack,
        renderPosition,
        aisleIndex,
      })
      currentX += layout.width + rackLayoutGap
    }
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
  const focusWindow = useWarehouseStore((state) => state.focusWindow)
  const rackMetricsById = useMemo(() => {
    const metricsById: RackMetricsById = new Map()
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
  const shadowBounds = Math.max(floorBounds.width, floorBounds.depth)
  const fogNear = Math.max(8, floorBounds.depth * 0.35)
  const fogFar = Math.max(22, floorBounds.depth * 0.95)

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
      <hemisphereLight color="#64748b" groundColor="#0f172a" intensity={0.45} />
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
