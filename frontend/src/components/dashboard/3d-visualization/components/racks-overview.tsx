import { Edges, Html, useCursor } from "@react-three/drei"

import { useState } from "react"
import { useAppTranslations } from "@/i18n/use-translations"
import { useWarehouseStore } from "../store"
import type { Rack3D } from "../types"
import { RACK_ZONE_SIZE } from "../types"
import { useClickGuard } from "../use-click-guard"
import type { RackRender } from "../warehouse-layout"
import { BlocksInstanced, getBlockLayout } from "./blocks-instanced"
import { getRackMetrics } from "./rack-metrics"
import { getShelfPositionsForGrid, RackShelves } from "./rack-shelves"
import { RackStructure } from "./rack-structure"
import type { RackTone } from "./rack-tone"

const AISLE_TONES: RackTone[] = [
  {
    frame: "#8b96a6",
    frameHover: "#a9b4c5",
    shelf: "#cfd6df",
    shelfHover: "#e0e7ef",
    outline: "#6aa2c7",
    outlineHover: "#8cc5ea",
    glow: "#6aa2c7",
  },
  {
    frame: "#988a7a",
    frameHover: "#b5a493",
    shelf: "#d7d0c6",
    shelfHover: "#e7e0d6",
    outline: "#caa46a",
    outlineHover: "#e0bf86",
    glow: "#caa46a",
  },
]

interface RackInstanceProps {
  rack: Rack3D
  renderPosition: [number, number, number]
  aisleIndex: number
  onFocus: (rackId: string) => void
}

function RackInstance({
  rack,
  renderPosition,
  aisleIndex,
  onFocus,
}: RackInstanceProps) {
  const t = useAppTranslations()

  const [hovered, setHovered] = useState(false)
  const { onPointerDown, shouldIgnoreClick } = useClickGuard()
  const occupiedCount = rack.items.filter((item) => item !== null).length
  const occupancy = (occupiedCount / (rack.grid.rows * rack.grid.cols)) * 100
  const metrics = getRackMetrics(rack)
  const tone = AISLE_TONES[aisleIndex % AISLE_TONES.length]
  const outlineOpacity = hovered ? 0.9 : 0.55
  const fillOpacity = hovered ? 0.18 : 0.06
  const isLargeGrid =
    rack.grid.rows > RACK_ZONE_SIZE || rack.grid.cols > RACK_ZONE_SIZE
  const blockLayout = isLargeGrid
    ? getBlockLayout(rack, metrics, RACK_ZONE_SIZE)
    : null
  const blockShelfPositions = blockLayout
    ? getShelfPositionsForGrid({
        rows: blockLayout.blockRows,
        unitY: blockLayout.unitY,
        gridHeight: blockLayout.gridHeight,
        cellHeight: blockLayout.blockSizeY,
        shelfThickness: metrics.shelfThickness,
      })
    : null
  const outlineWidth = blockLayout?.totalWidth ?? metrics.width
  const outlineHeight = blockLayout?.totalHeight ?? metrics.height
  const outlineDepth = blockLayout?.totalDepth ?? metrics.depth

  useCursor(hovered)

  return (
    <group
      position={renderPosition}
      rotation={[0, rack.transform.rotationY, 0]}
    >
      {!isLargeGrid && (
        <RackStructure
          hovered={hovered}
          metrics={metrics}
          rack={rack}
          showItems
          showShelves
          tone={tone}
        />
      )}
      {isLargeGrid && (
        <>
          {blockLayout && blockShelfPositions && (
            <RackShelves
              depth={blockLayout.totalDepth}
              shelfPositions={blockShelfPositions}
              thickness={metrics.shelfThickness}
              width={blockLayout.totalWidth}
            />
          )}
          <BlocksInstanced
            applyTransform={false}
            blockSize={RACK_ZONE_SIZE}
            clickable={false}
            hoverable={false}
            metrics={metrics}
            rack={rack}
          />
        </>
      )}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Three.js mesh */}
      <mesh
        onClick={(e) => {
          if (shouldIgnoreClick(e)) {
            return
          }
          onFocus(rack.id)
        }}
        onPointerDown={onPointerDown}
        onPointerOut={() => {
          setHovered(false)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
      >
        <boxGeometry args={[outlineWidth, outlineHeight, outlineDepth]} />
        <meshStandardMaterial
          color={tone.outline}
          depthWrite={false}
          emissive={tone.glow}
          emissiveIntensity={hovered ? 0.3 : 0.18}
          opacity={fillOpacity}
          transparent
        />
        <Edges
          color={hovered ? tone.outlineHover : tone.outline}
          lineWidth={1.2}
          opacity={outlineOpacity}
          scale={1.01}
          transparent
        />
      </mesh>
      {hovered && (
        <Html
          center
          distanceFactor={10}
          position={[0, outlineHeight / 2 + 0.5, 0]}
          zIndexRange={[10, 0]}
        >
          <div className="rounded border border-white/10 bg-slate-950/80 px-2 py-1 text-slate-100 text-xs">
            <div className="font-bold">{rack.code}</div>
            <div>
              {t("generated.dashboard.visualization3d.occupied2", {
                value0: Math.round(occupancy),
                value1: rack.grid.cols,
                value2: rack.grid.rows,
              })}
            </div>
            <div className="text-slate-400">
              {t("generated.dashboard.visualization3d.maxMm", {
                value0: rack.maxElementSize.width,
                value1: rack.maxElementSize.height,
                value2: rack.maxElementSize.depth,
              })}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface RacksOverviewProps {
  racks: RackRender[]
}

export function RacksOverview({ racks }: RacksOverviewProps) {
  const focusRack = useWarehouseStore((state) => state.focusRack)

  return (
    <group>
      {racks.map(({ rack, renderPosition, aisleIndex }) => (
        <RackInstance
          aisleIndex={aisleIndex}
          key={rack.id}
          onFocus={focusRack}
          rack={rack}
          renderPosition={renderPosition}
        />
      ))}
    </group>
  )
}
