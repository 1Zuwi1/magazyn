import Papa from "papaparse"
import type z from "zod"
import { CsvItemRowSchema, CsvRackRowSchema } from "@/lib/schemas/admin-schemas"

type CsvItemRow = z.infer<typeof CsvItemRowSchema>
type CsvRackRow = z.infer<typeof CsvRackRowSchema>

interface CsvParseError {
  row: number
  message: string
}

interface ParseCsvResult<T> {
  headers: string[]
  rows: T[]
  rawRows: Record<string, string>[]
  errors: CsvParseError[]
}

interface ParseCsvOptions {
  type: "rack" | "item"
  delimiter?: string
  skipEmptyLines?: boolean
}

const BOM_HEADER_REGEX = /^\uFEFF/

const normalizeHeader = (header: string) =>
  header.replace(BOM_HEADER_REGEX, "").trim()

const normalizeHeaderKey = (header: string) =>
  normalizeHeader(header).replace(/\s+/g, "").toLowerCase()

const numberFields = new Set([
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeightKg",
  "maxItemSize.width",
  "maxItemSize.height",
  "maxItemSize.depth",
  "weight",
  "dimensions.width",
  "dimensions.height",
  "dimensions.depth",
  "daysToExpiry",
])

const booleanFields = new Set(["isDangerous"])

const rackHeaderMap: Record<string, string> = {
  symbol: "symbol",
  name: "name",
  rows: "rows",
  cols: "cols",
  mintemp: "minTemp",
  maxtemp: "maxTemp",
  maxweightkg: "maxWeightKg",
  maxitemwidth: "maxItemSize.width",
  maxitemheight: "maxItemSize.height",
  maxitemdepth: "maxItemSize.depth",
  comment: "comment",
}

const itemHeaderMap: Record<string, string> = {
  name: "name",
  id: "id",
  imageurl: "imageUrl",
  mintemp: "minTemp",
  maxtemp: "maxTemp",
  weight: "weight",
  width: "dimensions.width",
  height: "dimensions.height",
  depth: "dimensions.depth",
  comment: "comment",
  daystoexpiry: "daysToExpiry",
  isdangerous: "isDangerous",
}

const coerceValue = (value: string, field: string): unknown => {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  if (numberFields.has(field)) {
    const parsed = Number.parseFloat(trimmed.replace(",", "."))
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (booleanFields.has(field)) {
    const lower = trimmed.toLowerCase()
    if (lower === "true") {
      return true
    }
    if (lower === "false") {
      return false
    }
    return undefined
  }

  return trimmed
}

const mapRow = (
  row: Record<string, string>,
  headerMap: Record<string, string>
): Record<string, unknown> => {
  const mapped: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(row)) {
    const mappedKey = headerMap[normalizeHeaderKey(key)]
    if (!mappedKey) {
      continue
    }

    const coercedValue = coerceValue(value, mappedKey)
    if (coercedValue !== undefined) {
      mapped[mappedKey] = coercedValue
    }
  }

  return mapped
}

const isRowEmpty = (row: Record<string, string>) =>
  !Object.values(row).some((v) => v.trim())

export const parseCsvData = <T extends CsvRackRow | CsvItemRow>(
  input: string,
  options: ParseCsvOptions
): ParseCsvResult<T> => {
  const result = Papa.parse<Record<string, string>>(input, {
    delimiter: options.delimiter ?? ";",
    skipEmptyLines: options.skipEmptyLines ?? true,
    header: true,
    comments: "#",
    transformHeader: normalizeHeader,
  })

  const headers = result.meta.fields ?? []
  const errors: CsvParseError[] = result.errors.map(
    (error: Papa.ParseError) => ({
      row: error.row ?? 0,
      message: error.message,
    })
  )

  const rawRows = result.data.filter((row) => !isRowEmpty(row))
  const schema = options.type === "rack" ? CsvRackRowSchema : CsvItemRowSchema
  const headerMap = options.type === "rack" ? rackHeaderMap : itemHeaderMap

  const rows: T[] = []

  rawRows.forEach((row, index) => {
    const mapped = mapRow(row, headerMap)
    const parsed = schema.safeParse(mapped)

    if (parsed.success) {
      rows.push(parsed.data as T)
    } else {
      const rowNumber = index + 2
      for (const issue of parsed.error.issues) {
        errors.push({
          row: rowNumber,
          message: `${issue.path.join(".")}: ${issue.message}`,
        })
      }
    }
  })

  return {
    headers,
    rows,
    rawRows,
    errors,
  }
}
