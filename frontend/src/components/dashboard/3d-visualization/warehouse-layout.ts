import { getBlockLayout } from "./components/blocks-instanced"
import { getRackMetrics, type RackMetrics } from "./components/rack-metrics"
import { VISUALIZATION_CONSTANTS } from "./constants"
import type { Rack3D } from "./types"
import { RACK_ZONE_SIZE } from "./types"

export interface RackRender {
  rack: Rack3D
  renderPosition: [number, number, number]
  aisleIndex: number
}

interface AisleBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
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

type RackMetricsById = Map<string, RackMetrics>

const {
  LAYOUT: {
    rackOutlinePadding,
    rackLayoutGap,
    floorPadding,
    aisleExplodeOffset,
    aisleSnap,
    aislePadding,
  },
} = VISUALIZATION_CONSTANTS

function getAisleKey(z: number): number {
  return Math.round(z / aisleSnap) * aisleSnap
}

export function buildWarehouseLayout(
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
  const aisleBounds = new Map<number, AisleBounds>()

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
