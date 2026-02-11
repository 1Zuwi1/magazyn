import type { Rack3D } from "../types"

export interface RackMetrics {
  width: number
  height: number
  depth: number
  unitX: number
  unitY: number
  gridWidth: number
  gridHeight: number
  frameThickness: number
  framePadding: number
  shelfThickness: number
  slotSize: { w: number; h: number; d: number }
}

const getGridSpan = (count: number, unit: number): number =>
  Math.max(0, count - 1) * unit

interface GridDimensions {
  width: number
  height: number
}

export const getGridDimensions = (
  cols: number,
  rows: number,
  unitX: number,
  unitY: number
): GridDimensions => ({
  width: getGridSpan(cols, unitX),
  height: getGridSpan(rows, unitY),
})

export const getRackMetrics = (rack: Rack3D): RackMetrics => {
  const unitX = rack.cell.w + rack.spacing.x
  const unitY = rack.cell.h + rack.spacing.y
  const gridWidth = getGridSpan(rack.grid.cols, unitX)
  const gridHeight = getGridSpan(rack.grid.rows, unitY)
  const framePadding = rack.frame?.padding ?? 0.05
  const frameThickness = rack.frame?.thickness ?? 0.03
  const slotSize = {
    w: rack.cell.w * 0.8,
    h: rack.cell.h * 0.75,
    d: rack.cell.d * 0.7,
  }
  const width = gridWidth + slotSize.w + framePadding * 2
  const height = gridHeight + slotSize.h + framePadding * 2
  const depth = rack.cell.d + framePadding * 2
  const shelfThickness = Math.max(frameThickness * 0.45, 0.012)

  return {
    width,
    height,
    depth,
    unitX,
    unitY,
    gridWidth,
    gridHeight,
    frameThickness,
    framePadding,
    shelfThickness,
    slotSize,
  }
}
