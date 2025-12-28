import type { Item3D, ItemStatus, Rack3D, Warehouse3D } from "./types"

const statuses: ItemStatus[] = [
  "normal",
  "normal",
  "normal",
  "normal",
  "expired",
  "dangerous",
]

function getRandomItem(itemId: string): Item3D | null {
  if (Math.random() > 0.6) {
    return null
  }

  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const sku = Math.floor(Math.random() * 9999)
  return {
    id: `item-${itemId}`,
    type: "box",
    status,
    label: `SKU-${sku}`,
    meta: {
      weight: Math.floor(Math.random() * 100),
      expiry: new Date(
        Date.now() + Math.random() * 315_360_000_000
      ).toISOString(),
    },
  }
}

interface MaxElementSize {
  width: number
  height: number
  depth: number
}

function generateRack(
  id: string,
  code: string,
  name: string,
  position: [number, number, number],
  rows: number,
  cols: number,
  maxElementSize: MaxElementSize
): Rack3D {
  const items: (Item3D | null)[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col
      const item = getRandomItem(`${code}-${row}-${col}`)
      items[index] = item
    }
  }

  const cellScale = 0.01

  return {
    id,
    code,
    name,
    grid: { rows, cols },
    cell: {
      w: maxElementSize.width * cellScale,
      h: maxElementSize.height * cellScale,
      d: maxElementSize.depth * cellScale,
    },
    maxElementSize,
    spacing: { x: 0.1, y: 0.05, z: 0 },
    transform: {
      position,
      rotationY: 0,
    },
    frame: { thickness: 0.02, padding: 0.05 },
    items,
    zone: `Strefa-${Math.floor(position[0] / 10) + 1}`,
  }
}

const rackPadding = 0.2

function getRackDimensions(rack: Rack3D): { width: number; depth: number } {
  return {
    width: rack.grid.cols * (rack.cell.w + rack.spacing.x) + rackPadding,
    depth: rack.cell.d + rackPadding,
  }
}

export function generateMockWarehouse(rackCount = 10): Warehouse3D {
  const racks: Rack3D[] = []
  const racksPerRow = 4
  const rackSpacing = 0.5
  const rowSpacing = 0.5

  for (let i = 0; i < rackCount; i++) {
    const rows = Math.floor(Math.random() * 4) + 4
    const cols = Math.floor(Math.random() * 6) + 6

    const maxElementSize = {
      width: Math.floor(Math.random() * 40) + 30,
      height: Math.floor(Math.random() * 30) + 20,
      depth: Math.floor(Math.random() * 20) + 20,
    }

    const rack = generateRack(
      `rack-${i}`,
      `R-${i + 1}`,
      `Regał ${i + 1}`,
      [0, 0, 0],
      rows,
      cols,
      maxElementSize
    )
    racks.push(rack)
  }

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
    currentRowZ += depth + rowSpacing
  }

  const rowXOffsets: number[] = []

  for (let i = 0; i < racks.length; i++) {
    const row = Math.floor(i / racksPerRow)
    const rack = racks[i]
    const { width } = getRackDimensions(rack)
    const currentRowX = rowXOffsets[row] ?? 0
    const x = currentRowX + width / 2
    const z = rowCenters[row] ?? 0

    rack.transform.position = [x, 0, z]
    rack.zone = `Strefa-${Math.floor(x / 10) + 1}`
    rowXOffsets[row] = currentRowX + width + rackSpacing
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

  const center = {
    x: (minX + maxX) / 2,
    y: 0,
    z: (minZ + maxZ) / 2,
  }

  return {
    id: "warehouse-1",
    name: "Główny Magazyn",
    racks,
    center,
  }
}
