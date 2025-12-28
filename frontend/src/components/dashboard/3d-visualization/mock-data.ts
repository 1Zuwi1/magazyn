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

export function generateMockWarehouse(rackCount = 10): Warehouse3D {
  const racks: Rack3D[] = []
  const racksPerRow = 4
  const rackSpacing = 0.2
  const rowSpacing = 1

  const currentRowPositions: number[] = []

  for (let i = 0; i < rackCount; i++) {
    const row = Math.floor(i / racksPerRow)
    const col = i % racksPerRow
    const y = 0

    const rows = Math.floor(Math.random() * 4) + 4
    const cols = Math.floor(Math.random() * 6) + 6

    const maxElementSize = {
      width: Math.floor(Math.random() * 40) + 30,
      height: Math.floor(Math.random() * 30) + 20,
      depth: Math.floor(Math.random() * 20) + 20,
    }

    const cellScale = 0.01
    const cell = {
      w: maxElementSize.width * cellScale,
      h: maxElementSize.height * cellScale,
      d: maxElementSize.depth * cellScale,
    }

    const rackWidth = cols * (cell.w + 0.1)
    const rackDepth = cell.d

    const x =
      (currentRowPositions[row] || 0) + (col > 0 ? rackWidth + rackSpacing : 0)
    const z = row * (rackDepth + rowSpacing)

    currentRowPositions[row] = x + rackWidth

    const rack = generateRack(
      `rack-${i}`,
      `R-${i + 1}`,
      `Regał ${i + 1}`,
      [x, y, z],
      rows,
      cols,
      maxElementSize
    )
    racks.push(rack)
  }

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const rack of racks) {
    const rackWidth = rack.grid.cols * (rack.cell.w + rack.spacing.x)
    const rackDepth = rack.cell.d

    const rackMinX = rack.transform.position[0]
    const rackMaxX = rack.transform.position[0] + rackWidth
    const rackMinZ = rack.transform.position[2]
    const rackMaxZ = rack.transform.position[2] + rackDepth

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
