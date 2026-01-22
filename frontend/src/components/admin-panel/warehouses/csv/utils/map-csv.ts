import type { Item, Rack } from "@/components/dashboard/types"
import type { CsvItemRow, CsvRackRow } from "./csv-utils"

export function mapRackCsv(rows: CsvRackRow[]): Rack[] {
  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    rows: row.rows,
    cols: row.cols,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    maxWeight: row.maxWeight,
    currentWeight: 0,
    maxItemSize: {
      x: row.maxItemWidth,
      y: row.maxItemHeight,
      z: row.maxItemDepth,
    },
    comment: row.comment,
    occupancy: 0,
    items: [],
  }))
}

export function mapItemCsv(rows: CsvItemRow[]): Item[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    weight: row.weight,
    width: row.width,
    height: row.height,
    depth: row.depth,
    comment: row.comment,
    daysToExpiry: row.daysToExpiry,
    qrCode: "",
    dimensions: {
      x: row.width,
      y: row.height,
      z: row.depth,
    },
    expiryDate: new Date(),
    isDangerous: row.isDangerous,
  }))
}
