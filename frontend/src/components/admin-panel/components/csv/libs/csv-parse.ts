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

interface ParseCsvInput {
  input: string
  options: ParseCsvOptions
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
  name: "name",
  rows: "rows",
  cols: "cols",
  minTemp: "minTemp",
  maxTemp: "maxTemp",
  maxWeightKg: "maxWeightKg",
  maxItemWidth: "maxItemSize.width",
  maxItemHeight: "maxItemSize.height",
  maxItemDepth: "maxItemSize.depth",
  comment: "comment",
}

const itemHeaderMap: Record<string, string> = {
  id: "id",
  name: "name",
  imageurl: "imageUrl",
  minTemp: "minTemp",
  maxTemp: "maxTemp",
  weight: "weight",
  width: "dimensions.width",
  height: "dimensions.height",
  depth: "dimensions.depth",
  comment: "comment",
  daysToExpiry: "daysToExpiry",
  isDangerous: "isDangerous",
}

const coerceValue = (value: string, field: string): unknown => {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return undefined
  }

  if (numberFields.has(field)) {
    const normalized = trimmed.replace(",", ".")
    const parsed = Number.parseFloat(normalized)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (booleanFields.has(field)) {
    const normalized = trimmed.toLowerCase()

    if (["true", "1", "tak", "yes"].includes(normalized)) {
      return true
    }

    if (["false", "0", "nie", "no"].includes(normalized)) {
      return false
    }

    return undefined
  }

  return trimmed
}

const setNestedValue = (
  target: Record<string, unknown>,
  path: string,
  value: unknown
) => {
  const segments = path.split(".")
  let current = target

  for (const [index, segment] of segments.entries()) {
    if (index === segments.length - 1) {
      current[segment] = value
      return
    }

    const next = current[segment]

    if (!next || typeof next !== "object") {
      current[segment] = {}
    }

    current = current[segment] as Record<string, unknown>
  }
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
    setNestedValue(mapped, mappedKey, coercedValue)
  }

  return mapped
}

const collectSchemaErrors = (
  row: number,
  issues: z.core.$ZodIssue[]
): CsvParseError[] =>
  issues.map((issue) => ({
    row,
    message: `${issue.path.join(".")}: ${issue.message}`,
  }))

const isRowEmpty = (row: Record<string, string>) =>
  Object.values(row).every((value) => value.trim().length === 0)

const parseCsvData = <T extends CsvRackRow | CsvItemRow>({
  input,
  options,
}: ParseCsvInput): ParseCsvResult<T> => {
  const result = Papa.parse<Record<string, string>>(input, {
    delimiter: options.delimiter ?? ";",
    skipEmptyLines: options.skipEmptyLines ?? true,
    header: true,
    comments: "#",
    transformHeader: normalizeHeader,
  })

  const headers = result.meta.fields ?? []
  const parserErrors = result.errors.map((error: Papa.ParseError) => ({
    row: error.row ?? 0,
    message: error.message,
  }))

  const rawRows = result.data.filter((row) => !isRowEmpty(row))
  const schema = options.type === "rack" ? CsvRackRowSchema : CsvItemRowSchema
  const headerMap = options.type === "rack" ? rackHeaderMap : itemHeaderMap

  const rows: T[] = []
  const errors: CsvParseError[] = [...parserErrors]

  rawRows.forEach((row, index) => {
    const mapped = mapRow(row, headerMap)
    const parsed = schema.safeParse(mapped)
    const rowNumber = index + 2

    if (!parsed.success) {
      errors.push(...collectSchemaErrors(rowNumber, parsed.error.issues))
      return
    }

    rows.push(parsed.data as T)
  })

  return {
    headers,
    rows,
    rawRows,
    errors,
  }
}

export const parseCSV = (
  input: string,
  options: ParseCsvOptions
): ParseCsvResult<CsvRackRow | CsvItemRow> => parseCsvData({ input, options })
