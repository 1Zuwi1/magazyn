import Papa from "papaparse"
import type z from "zod"
import { CsvItemRowSchema, CsvRackRowSchema } from "@/lib/schemas/admin-schemas"

export type CsvImporterType = "rack" | "item"

export type CsvRackRow = z.infer<typeof CsvRackRowSchema>
export type CsvItemRow = z.infer<typeof CsvItemRowSchema>

export type CsvRow = CsvRackRow | CsvItemRow

export interface CsvParseError {
  row: number
  message: string
}

export interface CsvParseResult {
  headers: string[]
  rows: CsvRow[]
  rawRows: Record<string, string>[]
  errors: CsvParseError[]
}

const BOM_HEADER_REGEX = /^\uFEFF/

const NUMBER_FIELDS = new Set([
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeight",
  "maxItemSize.width",
  "maxItemSize.height",
  "maxItemSize.depth",
  "weight",
  "dimensions.width",
  "dimensions.height",
  "dimensions.depth",
  "daysToExpiry",
])

const BOOLEAN_FIELDS = new Set(["isDangerous"])

const RACK_HEADER_MAP: Record<string, string> = {
  symbol: "symbol",
  name: "name",
  rows: "rows",
  cols: "cols",
  mintemp: "minTemp",
  maxtemp: "maxTemp",
  maxweight: "maxWeight",
  maxitemwidth: "maxItemSize.width",
  maxitemheight: "maxItemSize.height",
  maxitemdepth: "maxItemSize.depth",
  comment: "comment",
}

const ITEM_HEADER_MAP: Record<string, string> = {
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

const CONFIG = {
  rack: {
    schema: CsvRackRowSchema,
    headerMap: RACK_HEADER_MAP,
  },
  item: {
    schema: CsvItemRowSchema,
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

  if (BOOLEAN_FIELDS.has(field)) {
    const lower = trimmed.toLowerCase()
    if (lower === "true" || lower === "1" || lower === "tak") {
      return true
    }
    if (lower === "false" || lower === "0" || lower === "nie") {
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
    const targetPath = headerMap[csvKey]

    if (!(targetPath && value?.trim())) {
      continue
    }

    const coercedValue = coerceValue(value, targetPath)
    if (coercedValue === undefined) {
      continue
    }

    const pathParts = targetPath.split(".")

    if (pathParts.length === 1) {
      result[targetPath] = coercedValue
    } else {
      let current: Record<string, unknown> = result

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        if (!current[part]) {
          current[part] = {}
        }
        current = current[part] as Record<string, unknown>
      }

      const lastPart = pathParts.at(-1)
      if (lastPart) {
        current[lastPart] = coercedValue
      }
    }
  }

  return result
}

function isRowEmpty(row: Record<string, string>): boolean {
  return !Object.values(row).some((v) => v.trim())
}

export function parseCsvFile(
  file: File,
  type: CsvImporterType
): Promise<CsvParseResult> {
  const config = CONFIG[type]
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
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
        const validRows: CsvRow[] = []

        for (const [index, row] of rawRows.entries()) {
          const mapped = mapRow(row, config.headerMap)
          const parsed = config.schema.safeParse(mapped)

          if (parsed.success) {
            validRows.push(parsed.data as CsvRow)
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

export function parseCsvString(
  csvString: string,
  type: CsvImporterType
): CsvParseResult {
  const config = CONFIG[type]
  const errors: CsvParseError[] = []

  const results = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    delimiter: ";",
    transformHeader: normalizeHeader,
  })

  for (const error of results.errors) {
    errors.push({
      row: error.row ?? 0,
      message: error.message,
    })
  }

  const rawRows = results.data.filter((row) => !isRowEmpty(row))
  const validRows: CsvRow[] = []

  for (const [index, row] of rawRows.entries()) {
    const mapped = mapRow(row, config.headerMap)
    const parsed = config.schema.safeParse(mapped)

    if (parsed.success) {
      validRows.push(parsed.data as CsvRow)
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

  return {
    headers: results.meta.fields ?? [],
    rows: validRows,
    rawRows,
    errors,
  }
}
