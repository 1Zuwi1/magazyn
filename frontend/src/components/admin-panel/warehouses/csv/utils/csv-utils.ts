import Papa from "papaparse"
import { ItemSchema, RackCsvSchema } from "@/lib/schemas/csv-schemas"
import type {
  CsvImporterType,
  CsvParseError,
  CsvParseResult,
  CsvRowType,
} from "./types"

const BOM_HEADER_REGEX = /^\uFEFF/

const NUMBER_FIELDS = new Set([
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeight",
  "maxItemWidth",
  "maxItemHeight",
  "maxItemDepth",
  "weight",
  "width",
  "height",
  "depth",
  "daysToExpiry",
])

const RACK_HEADER_MAP: Record<string, string> = {
  symbol: "symbol",
  name: "name",
  rows: "rows",
  cols: "cols",
  mintemp: "minTemp",
  maxtemp: "maxTemp",
  maxweight: "maxWeight",
  maxitemwidth: "maxItemWidth",
  maxitemheight: "maxItemHeight",
  maxitemdepth: "maxItemDepth",
  comment: "comment",
}

const ITEM_HEADER_MAP: Record<string, string> = {
  name: "name",
  id: "id",
  imageurl: "imageUrl",
  mintemp: "minTemp",
  maxtemp: "maxTemp",
  weight: "weight",
  width: "width",
  height: "height",
  depth: "depth",
  comment: "comment",
  daystoexpiry: "daysToExpiry",
  isdangerous: "isDangerous",
}

const CONFIG = {
  rack: {
    schema: RackCsvSchema,
    headerMap: RACK_HEADER_MAP,
  },
  item: {
    schema: ItemSchema,
    headerMap: ITEM_HEADER_MAP,
  },
}

function normalizeHeader(header: string): string {
  return header
    .replace(BOM_HEADER_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
}

function coerceValue(value: string, field: string): unknown {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  if (NUMBER_FIELDS.has(field)) {
    const parsed = Number.parseFloat(trimmed.replace(",", "."))
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (new Set(["isdangerous"]).has(field)) {
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

function mapRow(
  row: Record<string, string>,
  headerMap: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [csvKey, value] of Object.entries(row)) {
    const targetField = headerMap[csvKey]

    if (!(targetField && value?.trim())) {
      continue
    }

    const coercedValue = coerceValue(value, targetField)
    if (coercedValue !== undefined) {
      result[targetField] = coercedValue
    }
  }

  return result
}

function isRowEmpty(row: Record<string, string>): boolean {
  return !Object.values(row).some((v) => v.trim())
}

export function parseCsvFile<T extends CsvImporterType>(
  file: File,
  type: T
): Promise<CsvParseResult<T>> {
  const config = CONFIG[type]
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      transformHeader: normalizeHeader,
      complete: (results) => {
        for (const error of results.errors) {
          errors.push({
            row: error.row ?? 0,
            message: error.message,
          })
        }

        const rawRows = results.data.filter((row) => !isRowEmpty(row))
        const validRows: CsvRowType<T>[] = []

        for (const [index, row] of rawRows.entries()) {
          const mapped = mapRow(row, config.headerMap)
          const parsed = config.schema.safeParse(mapped)

          if (parsed.success) {
            validRows.push(parsed.data as CsvRowType<T>)
          } else {
            const rowNumber = index + 2

            for (const issue of parsed.error.issues) {
              errors.push({
                row: rowNumber,
                message: `${issue.path.join(".")}: ${issue.message}`,
              })
            }
          }
        }

        resolve({
          headers: results.meta.fields ?? [],
          rows: validRows,
          rawRows,
          errors,
        })
      },
      error: reject,
    })
  })
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "")
}
