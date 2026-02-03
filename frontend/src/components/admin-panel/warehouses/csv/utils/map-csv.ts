import type { Rack } from "@/components/dashboard/types"
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
