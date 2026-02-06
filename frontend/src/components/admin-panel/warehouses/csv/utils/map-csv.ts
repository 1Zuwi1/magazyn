import type { Item, Rack } from "@/components/dashboard/types"
import type { ItemCsvData, RackCsvData } from "./types"

export function mapRackCsv(rows: RackCsvData[]): Rack[] {
  return rows.map((row) => ({
    id: crypto.randomUUID(),
    marker: row.marker,
    rows: row.rows,
    cols: row.cols,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    maxWeight: row.maxWeight,
    currentWeight: 0,
    maxItemWidth: row.maxItemWidth,
    maxItemHeight: row.maxItemHeight,
    maxItemDepth: row.maxItemDepth,
    comment: row.comment ?? null,
    occupancy: 0,
    items: [],
  }))
}

export function mapItemCsv(rows: ItemCsvData[]): Item[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    qrCode: crypto.randomUUID(),
    imageUrl: row.imageUrl || null,
    minTemp: row.minTemp,
    maxTemp: row.maxTemp,
    weight: row.weight,
    width: row.width,
    height: row.height,
    depth: row.depth,
    comment: row.comment,
    daysToExpiry: row.daysToExpiry,
    isDangerous: row.isDangerous,
  }))
}
