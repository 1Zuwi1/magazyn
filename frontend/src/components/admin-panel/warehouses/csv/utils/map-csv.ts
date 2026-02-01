import type { Item, Rack } from "@/components/dashboard/types"
import type { CsvRowType } from "./types"

export function mapRackCsv(rows: CsvRowType<"rack">[]): Rack[] {
  return rows.map((row) => ({
    id: crypto.randomUUID(),
    symbol: row.symbol,
    name: row.name,
    rows: row.rows,
    cols: row.cols,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    maxWeight: row.maxWeight,
    currentWeight: 0,
    maxItemWidth: row.maxItemWidth,
    maxItemHeight: row.maxItemHeight,
    maxItemDepth: row.maxItemDepth,
    comment: row.comment,
    occupancy: 0,
    items: [],
  }))
}

export function mapItemCsv(rows: CsvRowType<"item">[]): Item[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    qrCode: row.qrCode,
    imageUrl: row.imageUrl,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    weight: row.weight,
    width: row.width,
    height: row.height,
    depth: row.depth,
    daysToExpiry: row.daysToExpiry,
    comment: row.comment,
    isDangerous: row.isDangerous,
  }))
}
