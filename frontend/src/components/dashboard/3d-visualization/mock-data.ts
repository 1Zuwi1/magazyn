import type { Item3D, ItemStatus, Rack3D, Warehouse3D } from "./types"

const statuses: ItemStatus[] = [
  "normal",
  "normal",
  "normal",
  "normal",
  "expired",
  "dangerous",
  "expired-dangerous",
]

const EXPIRY_OFFSET_MS = 315_360_000_000
const EXPIRY_BASE_MS = 1_700_000_000_000
const RNG_MODULUS = 2_147_483_647
const RNG_MULTIPLIER = 48_271

type RandomFn = () => number

function createRng(seed: number): RandomFn {
  const normalizedSeed = Math.floor(seed) % RNG_MODULUS
  let state =
    normalizedSeed <= 0 ? normalizedSeed + (RNG_MODULUS - 1) : normalizedSeed
  return () => {
    state = (state * RNG_MULTIPLIER) % RNG_MODULUS
    return (state - 1) / (RNG_MODULUS - 1)
  }
}

function getRandomItem(
  itemId: string,
  random: RandomFn,
  expiryBase: number
): Item3D | null {
  if (random() > 0.6) {
    return null
  }

  const status = statuses[Math.floor(random() * statuses.length)]
  const sku = Math.floor(random() * 9999)
  return {
    id: `item-${itemId}`,
    type: "box",
    status,
    label: `SKU-${sku}`,
    meta: {
      weight: Math.floor(random() * 100),
      expiry: new Date(expiryBase + random() * EXPIRY_OFFSET_MS).toISOString(),
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
  maxElementSize: MaxElementSize,
  random: RandomFn,
  expiryBase: number
): Rack3D {
  const items: (Item3D | null)[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col
      const item = getRandomItem(`${code}-${row}-${col}`, random, expiryBase)
      items[index] = item
    }
  }

  const cellScale = 0.001

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

function getRackDimensions(rack: Rack3D): {
  width: number
  height: number
  depth: number
} {
  const unitY = rack.cell.h + rack.spacing.y
  const gridHeight = Math.max(0, rack.grid.rows - 1) * unitY
  const framePadding = rack.frame?.padding ?? 0.05
  const slotHeight = rack.cell.h * 0.75

  return {
    width: rack.grid.cols * (rack.cell.w + rack.spacing.x) + rackPadding,
    height: gridHeight + slotHeight + framePadding * 2,
    depth: rack.cell.d + rackPadding,
  }
}

export function generateMockWarehouse(rackCount = 10, seed = 1): Warehouse3D {
  const racks: Rack3D[] = []
  const racksPerRow = 4
  const rackSpacing = 0.5
  const rowSpacing = 2
  const random = createRng(seed)
  const expiryBase = EXPIRY_BASE_MS

  for (let i = 0; i < rackCount; i++) {
    const rows = Math.floor(random() * 4) + 4
    const cols = Math.floor(random() * 6) + 6

    const maxElementSize = {
      width: Math.floor(random() * 400) + 300,
      height: Math.floor(random() * 300) + 200,
      depth: Math.floor(random() * 300) + 200,
    }

    const rack = generateRack(
      `rack-${i}`,
      `R-${i + 1}`,
      `Regał ${i + 1}`,
      [0, 0, 0],
      rows,
      cols,
      maxElementSize,
      random,
      expiryBase
    )
    racks.push(rack)
  }

  racks.push({
    id: "rack-special-1",
    code: "R-SPECIAL-1",
    name: "Regał Specjalny 1",
    grid: { rows: 100, cols: 100 },
    cell: { w: 0.35, h: 0.25, d: 0.25 },
    maxElementSize: { width: 350, height: 250, depth: 250 },
    spacing: { x: 0.1, y: 0.05, z: 0 },
    transform: {
      position: [0, 0, 0],
      rotationY: 0,
    },
    items: [],
  })

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
    const { width, height } = getRackDimensions(rack)
    const currentRowX = rowXOffsets[row] ?? 0
    const x = currentRowX + width / 2
    const z = rowCenters[row] ?? 0

    rack.transform.position = [x, height / 2, z]
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
