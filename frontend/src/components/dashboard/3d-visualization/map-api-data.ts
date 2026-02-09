import { parseImageSrc } from "@/components/ui/item-photo"
import type { WarehouseAssortmentsList } from "@/hooks/use-assortment"
import type { RacksList } from "@/hooks/use-racks"
import type { WarehousesList } from "@/hooks/use-warehouses"
import type { Item3D, Rack3D, Warehouse3D } from "./types"

type ApiRack = RacksList["content"][number]
type ApiWarehouse = WarehousesList["content"][number]
type ApiAssortment = WarehouseAssortmentsList["content"][number]

const RACK_SPACING = 0.5
const ROW_SPACING = 2

const SPACING_RATIO_X = 0.2
const SPACING_RATIO_Y = 0.15
const FRAME_THICKNESS_RATIO = 0.05
const FRAME_PADDING_RATIO = 0.12
const MIN_FRAME_THICKNESS = 0.005
const MAX_FRAME_THICKNESS = 0.04
const MIN_FRAME_PADDING = 0.01
const MAX_FRAME_PADDING = 0.06

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getItemStatus(
  expiresAt: string,
  isDangerous: boolean,
  nowTimestampMs: number
): Item3D["status"] {
  const expiresAtTimestampMs = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiresAtTimestampMs)) {
    return isDangerous ? "dangerous" : "normal"
  }
  const isExpired =
    Number.isFinite(expiresAtTimestampMs) &&
    expiresAtTimestampMs < nowTimestampMs

  if (isExpired && isDangerous) {
    return "expired-dangerous"
  }
  if (isExpired) {
    return "expired"
  }
  if (isDangerous) {
    return "dangerous"
  }
  return "normal"
}

function mapApiRackToRack3D(
  rack: ApiRack,
  rackAssortments: readonly ApiAssortment[],
  nowTimestampMs: number
): Rack3D {
  const rows = Math.max(1, rack.sizeY)
  const cols = Math.max(1, rack.sizeX)
  const totalSlots = rows * cols
  const items: (Item3D | null)[] = Array.from<Item3D | null>({
    length: totalSlots,
  }).fill(null)

  const cellW = 0.1
  const cellH = 0.1
  const cellD = 0.1
  const minCellDim = Math.min(cellW, cellH)

  for (const assortment of rackAssortments) {
    const row = assortment.positionY - 1
    const col = assortment.positionX - 1

    if (row >= rows || col >= cols) {
      continue
    }

    const index = row * cols + col
    items[index] = {
      id: String(assortment.id),
      status: getItemStatus(
        assortment.expiresAt,
        assortment.item.dangerous ?? false,
        nowTimestampMs
      ),
      label: assortment.item.name,
      imageUrl: assortment.item.photoUrl
        ? (parseImageSrc(`/api/items/${assortment.item.id}/photo`) ?? undefined)
        : undefined,
    }
  }

  return {
    id: String(rack.id),
    code: rack.marker ?? `R-${rack.id}`,
    name: rack.marker ?? `Regał ${rack.id}`,
    grid: { rows, cols },
    cell: { w: cellW, h: cellH, d: cellD },
    maxElementSize: {
      width: rack.maxSizeX,
      height: rack.maxSizeY,
      depth: rack.maxSizeZ,
    },
    spacing: {
      x: cellW * SPACING_RATIO_X,
      y: cellH * SPACING_RATIO_Y,
      z: 0,
    },
    transform: {
      position: [0, 0, 0],
      rotationY: 0,
    },
    frame: {
      thickness: clamp(
        minCellDim * FRAME_THICKNESS_RATIO,
        MIN_FRAME_THICKNESS,
        MAX_FRAME_THICKNESS
      ),
      padding: clamp(
        minCellDim * FRAME_PADDING_RATIO,
        MIN_FRAME_PADDING,
        MAX_FRAME_PADDING
      ),
    },
    items,
  }
}

function groupAssortmentsByRack(
  assortments: readonly ApiAssortment[]
): Map<number, ApiAssortment[]> {
  const assortmentByRack = new Map<number, ApiAssortment[]>()

  for (const assortment of assortments) {
    const existing = assortmentByRack.get(assortment.rackId)
    if (existing) {
      existing.push(assortment)
      continue
    }
    assortmentByRack.set(assortment.rackId, [assortment])
  }

  return assortmentByRack
}

function getRackDimensions(rack: Rack3D): {
  width: number
  height: number
  depth: number
} {
  const unitX = rack.cell.w + rack.spacing.x
  const unitY = rack.cell.h + rack.spacing.y
  const gridWidth = Math.max(0, rack.grid.cols - 1) * unitX
  const gridHeight = Math.max(0, rack.grid.rows - 1) * unitY
  const framePadding = rack.frame?.padding ?? 0.05
  const slotW = rack.cell.w * 0.8
  const slotH = rack.cell.h * 0.75

  return {
    width: gridWidth + slotW + framePadding * 2,
    height: gridHeight + slotH + framePadding * 2,
    depth: rack.cell.d + framePadding * 2,
  }
}

function layoutRacks(racks: Rack3D[]): void {
  if (racks.length === 0) {
    return
  }

  const racksPerRow = Math.max(1, Math.ceil(Math.sqrt(racks.length)))

  const rowDepths: number[] = []

  for (let i = 0; i < racks.length; i++) {
    const row = Math.floor(i / racksPerRow)
    const { depth } = getRackDimensions(racks[i])
    rowDepths[row] = Math.max(rowDepths[row] ?? 0, depth)
  }

  const rowCenters: number[] = []
  let currentRowZ = 0

  for (const depth of rowDepths) {
    rowCenters.push(currentRowZ + depth / 2)
    currentRowZ += depth + ROW_SPACING
  }

  const rowXOffsets: number[] = []

  for (let i = 0; i < racks.length; i++) {
    const row = Math.floor(i / racksPerRow)
    const rack = racks[i]
    const { width, height } = getRackDimensions(rack)
    const currentRowX = rowXOffsets[row] ?? 0
    const x = currentRowX + width / 2
    const z = rowCenters[row] ?? 0

    rack.transform.position = [x, height / 2, z]
    rowXOffsets[row] = currentRowX + width + RACK_SPACING
  }
}

function computeCenter(racks: Rack3D[]): {
  x: number
  y: number
  z: number
} {
  if (racks.length === 0) {
    return { x: 0, y: 0, z: 0 }
  }

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const rack of racks) {
    const { width, depth } = getRackDimensions(rack)
    const rackMinX = rack.transform.position[0] - width / 2
    const rackMaxX = rack.transform.position[0] + width / 2
    const rackMinZ = rack.transform.position[2] - depth / 2
    const rackMaxZ = rack.transform.position[2] + depth / 2

    minX = Math.min(minX, rackMinX)
    maxX = Math.max(maxX, rackMaxX)
    minZ = Math.min(minZ, rackMinZ)
    maxZ = Math.max(maxZ, rackMaxZ)
  }

  return {
    x: (minX + maxX) / 2,
    y: 0,
    z: (minZ + maxZ) / 2,
  }
}

export function buildWarehouse3DFromApi(
  apiWarehouse: ApiWarehouse,
  apiRacks: ApiRack[],
  apiAssortments: readonly ApiAssortment[] = []
): Warehouse3D {
  const assortmentByRack = groupAssortmentsByRack(apiAssortments)
  const nowTimestampMs = Date.now()
  const racks = apiRacks.map((rack) =>
    mapApiRackToRack3D(
      rack,
      assortmentByRack.get(rack.id) ?? [],
      nowTimestampMs
    )
  )

  layoutRacks(racks)

  return {
    id: String(apiWarehouse.id),
    name: apiWarehouse.name,
    racks,
    center: computeCenter(racks),
  }
}
