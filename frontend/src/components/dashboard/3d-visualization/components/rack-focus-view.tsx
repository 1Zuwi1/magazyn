import { Edges } from "@react-three/drei"
import { VISUALIZATION_CONSTANTS } from "../constants"
import type { FocusWindow, Rack3D } from "../types"
import { RACK_ZONE_SIZE } from "../types"
import { BlocksInstanced, getBlockLayout } from "./blocks-instanced"
import { ItemsFocus } from "./items-focus"
import { getRackMetrics } from "./rack-metrics"
import { getShelfPositionsForGrid, RackShelves } from "./rack-shelves"
import { RackStructure } from "./rack-structure"
import { ShelvesInstanced } from "./shelves-instanced"

const {
  COLORS: { floor: floorColor },
} = VISUALIZATION_CONSTANTS

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

export function RackFocusView({
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
