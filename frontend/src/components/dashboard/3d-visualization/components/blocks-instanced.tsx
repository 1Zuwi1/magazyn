import { Html, Instance, Instances, useCursor } from "@react-three/drei"
import { useMemo, useState } from "react"
import { useWarehouseStore } from "../store"
import type { ItemStatus, ItemVisual, Rack3D } from "../types"
import { getItemVisuals, getWorstStatus, RACK_ZONE_SIZE } from "../types"
import { getRackMetrics, type RackMetrics } from "./rack-structure"
import {
  STRIPE_EMISSIVE_INTENSITY,
  STRIPE_MATERIAL_DEFAULTS,
  useStripeTexture,
} from "./stripe-texture"

const BLOCK_EMPTY_VISUAL: ItemVisual = {
  color: "#1f2937",
  glow: "#0f172a",
  emissiveIntensity: 0.05,
}
const BLOCK_OPACITY = 0.32
const HOVER_COLOR = "#60a5fa"
const HIGHLIGHT_OPACITY = 0.4
const BLOCK_VISUAL_SCALE = 2
type BlockStatusKey = ItemStatus | "empty"
const BLOCK_GAP_RATIO = 0.18
const TOOLTIP_OFFSET = 0.45

const STATUS_LABELS: Record<BlockStatusKey, string> = {
  normal: "Normalny",
  dangerous: "Niebezpieczny",
  expired: "Przeterminowany",
  "expired-dangerous": "Przeterminowany i niebezpieczny",
  empty: "Pusta strefa",
}

interface BlockInfo {
  key: string
  position: [number, number, number]
  startRow: number
  startCol: number
  rows: number
  cols: number
  occupiedCount: number
  slotCount: number
  status: BlockStatusKey
}

export interface BlockLayout {
  blockRows: number
  blockCols: number
  blockSizeX: number
  blockSizeY: number
  blockSizeZ: number
  unitX: number
  unitY: number
  gridWidth: number
  gridHeight: number
  totalWidth: number
  totalHeight: number
  totalDepth: number
}

export function getBlockLayout(
  rack: Rack3D,
  metrics?: RackMetrics,
  blockSize = RACK_ZONE_SIZE
): BlockLayout {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const blockRows = Math.max(1, Math.ceil(rack.grid.rows / blockSize))
  const blockCols = Math.max(1, Math.ceil(rack.grid.cols / blockSize))
  const sizeX = resolvedMetrics.slotSize.w * BLOCK_VISUAL_SCALE
  const sizeY = resolvedMetrics.slotSize.h * BLOCK_VISUAL_SCALE
  const sizeZ = Math.min(
    resolvedMetrics.slotSize.d * BLOCK_VISUAL_SCALE,
    resolvedMetrics.depth
  )
  const unitX = sizeX + sizeX * BLOCK_GAP_RATIO
  const unitY = sizeY + sizeY * BLOCK_GAP_RATIO
  const gridWidth = (blockCols - 1) * unitX
  const gridHeight = (blockRows - 1) * unitY

  return {
    blockRows,
    blockCols,
    blockSizeX: sizeX,
    blockSizeY: sizeY,
    blockSizeZ: sizeZ,
    unitX,
    unitY,
    gridWidth,
    gridHeight,
    totalWidth: gridWidth + sizeX,
    totalHeight: gridHeight + sizeY,
    totalDepth: sizeZ,
  }
}

interface BlocksInstancedProps {
  rack: Rack3D
  metrics?: RackMetrics
  applyTransform?: boolean
  blockSize?: number
  hoverable?: boolean
  clickable?: boolean
}

const getVisuals = (
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  rack: Rack3D
) => {
  let occupiedCount = 0
  let worstStatus: ItemStatus | null = null
  for (let r = startRow; r < endRow; r++) {
    const rowOffset = r * rack.grid.cols
    for (let c = startCol; c < endCol; c++) {
      if (rowOffset + c >= rack.items.length) {
        continue
      }
      const item = rack.items[rowOffset + c]
      if (!item) {
        continue
      }
      occupiedCount += 1
      worstStatus = getWorstStatus(worstStatus, item.status)
      if (worstStatus === "expired-dangerous") {
        break
      }
    }
    if (worstStatus === "expired-dangerous") {
      break
    }
  }

  return {
    occupiedCount,
    worstStatus,
  }
}

const orderBlocks = (
  blockRows: number,
  blockCols: number,
  blockSize: number,
  rack: Rack3D,
  unitX: number,
  unitY: number,
  gridWidth: number,
  gridHeight: number,
  blockLookupMap: Record<string, BlockInfo>,
  blocksByStatusMap: Record<BlockStatusKey, BlockInfo[]>
) => {
  for (let row = 0; row < blockRows; row++) {
    const startRow = row * blockSize
    const endRow = Math.min(rack.grid.rows, startRow + blockSize)
    const y = (blockRows - 1 - row) * unitY - gridHeight / 2

    for (let col = 0; col < blockCols; col++) {
      const startCol = col * blockSize
      const endCol = Math.min(rack.grid.cols, startCol + blockSize)
      const x = col * unitX - gridWidth / 2
      const { occupiedCount, worstStatus } = getVisuals(
        startRow,
        endRow,
        startCol,
        endCol,
        rack
      )

      const statusKey: BlockStatusKey = worstStatus ?? "empty"
      const blockKey = `${row}-${col}`
      const slotCount = (endRow - startRow) * (endCol - startCol)
      const blockInfo: BlockInfo = {
        key: blockKey,
        position: [x, y, 0],
        startRow,
        startCol,
        rows: endRow - startRow,
        cols: endCol - startCol,
        occupiedCount,
        slotCount,
        status: statusKey,
      }

      blockLookupMap[blockKey] = blockInfo
      blocksByStatusMap[statusKey].push(blockInfo)
    }
  }
}

export function BlocksInstanced({
  rack,
  metrics,
  applyTransform = true,
  blockSize = RACK_ZONE_SIZE,
  hoverable = true,
  clickable = true,
}: BlocksInstancedProps) {
  const { setFocusWindow } = useWarehouseStore()
  const [hoveredBlockKey, setHoveredBlockKey] = useState<string | null>(null)
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const stripeTexture = useStripeTexture()
  const isInteractive = hoverable || clickable
  const disabledRaycast = isInteractive ? undefined : () => null
  const layout = useMemo(
    () => getBlockLayout(rack, resolvedMetrics, blockSize),
    [blockSize, rack, resolvedMetrics]
  )

  const { blocksByStatus, blockLookup } = useMemo(() => {
    const blocksByStatusMap: Record<BlockStatusKey, BlockInfo[]> = {
      normal: [],
      dangerous: [],
      expired: [],
      "expired-dangerous": [],
      empty: [],
    }
    const blockLookupMap: Record<string, BlockInfo> = {}
    const { blockRows, blockCols, unitX, unitY, gridWidth, gridHeight } = layout
    orderBlocks(
      blockRows,
      blockCols,
      blockSize,
      rack,
      unitX,
      unitY,
      gridWidth,
      gridHeight,
      blockLookupMap,
      blocksByStatusMap
    )

    return {
      blocksByStatus: blocksByStatusMap,
      blockLookup: blockLookupMap,
    }
  }, [blockSize, rack, layout])

  const hoveredBlock =
    hoveredBlockKey !== null ? blockLookup[hoveredBlockKey] : null

  useCursor(hoverable && hoveredBlock !== null)

  const groupProps = applyTransform
    ? {
        position: rack.transform.position,
        rotation: [0, rack.transform.rotationY, 0] as [number, number, number],
      }
    : {}

  const renderBlocks = (statusKey: BlockStatusKey) => {
    const blocks = blocksByStatus[statusKey]
    if (!blocks || blocks.length === 0) {
      return null
    }
    const visuals =
      statusKey === "empty" ? BLOCK_EMPTY_VISUAL : getItemVisuals(statusKey)
    const glow = statusKey === "empty" ? BLOCK_EMPTY_VISUAL.glow : visuals.glow
    const emissiveIntensity =
      statusKey === "empty"
        ? BLOCK_EMPTY_VISUAL.emissiveIntensity
        : visuals.emissiveIntensity

    const stripeColor = visuals.stripeColor

    return (
      <group>
        <Instances
          frustumCulled={false}
          limit={blocks.length}
          raycast={disabledRaycast}
        >
          <boxGeometry
            args={[layout.blockSizeX, layout.blockSizeY, layout.blockSizeZ]}
          />
          <meshStandardMaterial
            color={visuals.color}
            depthWrite={false}
            emissive={glow}
            emissiveIntensity={emissiveIntensity}
            metalness={0.05}
            opacity={BLOCK_OPACITY}
            roughness={0.7}
            transparent
          />
          {blocks.map((block) => (
            <Instance
              key={block.key}
              onClick={
                clickable
                  ? (event) => {
                      event.stopPropagation()
                      setFocusWindow({
                        rackId: rack.id,
                        startRow: block.startRow,
                        startCol: block.startCol,
                        rows: block.rows,
                        cols: block.cols,
                      })
                    }
                  : undefined
              }
              onPointerOut={
                hoverable
                  ? (event) => {
                      event.stopPropagation()
                      setHoveredBlockKey(null)
                    }
                  : undefined
              }
              onPointerOver={
                hoverable
                  ? (event) => {
                      event.stopPropagation()
                      setHoveredBlockKey(block.key)
                    }
                  : undefined
              }
              position={block.position}
            />
          ))}
        </Instances>
        {stripeColor && stripeTexture && (
          <Instances
            frustumCulled={false}
            limit={blocks.length}
            raycast={disabledRaycast}
            renderOrder={1}
          >
            <boxGeometry
              args={[layout.blockSizeX, layout.blockSizeY, layout.blockSizeZ]}
            />
            <meshStandardMaterial
              {...STRIPE_MATERIAL_DEFAULTS}
              alphaMap={stripeTexture}
              color={stripeColor}
              emissive={stripeColor}
              emissiveIntensity={STRIPE_EMISSIVE_INTENSITY}
            />
            {blocks.map((block) => (
              <Instance key={`${block.key}-stripe`} position={block.position} />
            ))}
          </Instances>
        )}
      </group>
    )
  }

  return (
    <group {...groupProps}>
      {renderBlocks("empty")}
      {renderBlocks("normal")}
      {renderBlocks("dangerous")}
      {renderBlocks("expired")}
      {renderBlocks("expired-dangerous")}
      {hoverable && hoveredBlock && (
        <Instances frustumCulled={false} limit={1} raycast={() => null}>
          <boxGeometry
            args={[
              layout.blockSizeX * 1.02,
              layout.blockSizeY * 1.02,
              layout.blockSizeZ,
            ]}
          />
          <meshStandardMaterial
            color={HOVER_COLOR}
            depthWrite={false}
            opacity={HIGHLIGHT_OPACITY}
            transparent
          />
          <Instance position={hoveredBlock.position} />
        </Instances>
      )}
      {hoverable && hoveredBlock && (
        <Html
          center
          distanceFactor={9}
          position={[
            hoveredBlock.position[0],
            hoveredBlock.position[1] + layout.blockSizeY / 2 + TOOLTIP_OFFSET,
            hoveredBlock.position[2],
          ]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[15, 0]}
        >
          <div className="pointer-events-none min-w-55 rounded border border-white/10 bg-slate-950/80 px-3 py-2 text-center text-slate-100 text-xs">
            <div className="font-bold">
              Strefa {hoveredBlock.startRow + 1}–
              {hoveredBlock.startRow + hoveredBlock.rows},{" "}
              {hoveredBlock.startCol + 1}–
              {hoveredBlock.startCol + hoveredBlock.cols}
            </div>
            <div>
              Zajęte: {hoveredBlock.occupiedCount}/{hoveredBlock.slotCount} (
              {hoveredBlock.slotCount > 0
                ? Math.round(
                    (hoveredBlock.occupiedCount / hoveredBlock.slotCount) * 100
                  )
                : 0}
              %)
            </div>
            <div className="text-slate-400">
              Status: {STATUS_LABELS[hoveredBlock.status]}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
