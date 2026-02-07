import Papa from "papaparse"
import {
  ItemCsvSchema,
  RackCsvSchema,
  WarehouseCsvSchema,
} from "@/lib/schemas/csv-schemas"
import {
  DEFAULT_CONFIG,
  ITEM_COLUMNS,
  RACK_COLUMNS,
  WAREHOUSE_COLUMNS,
} from "./constants"
import type {
  CsvImporterType,
  CsvParseError,
  CsvParseResult,
  CsvRowType,
} from "./types"

const BOM_HEADER_REGEX = /^\uFEFF/

const NUMBER_FIELDS = new Set([
  "warehouseId",
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

const BOOLEAN_FIELDS = new Set(["isDangerous"])
const COMMENT_PREFIX_REGEX = /^#\s*/

const WAREHOUSE_HEADER_MAP: Record<string, string> = {
  name: "name",
  nazwa: "name",
  warehouse: "name",
}

const RACK_HEADER_MAP: Record<string, string> = {
  marker: "marker",
  oznaczenie: "marker",
  m: "rows",
  rows: "rows",
  n: "cols",
  cols: "cols",
  tempmin: "minTemp",
  mintemp: "minTemp",
  tempmax: "maxTemp",
  maxtemp: "maxTemp",
  maxwagakg: "maxWeight",
  maxweight: "maxWeight",
  maxszerokoscmm: "maxItemWidth",
  maxitemwidth: "maxItemWidth",
  maxwysokoscmm: "maxItemHeight",
  maxitemheight: "maxItemHeight",
  maxglebokoscmm: "maxItemDepth",
  maxitemdepth: "maxItemDepth",
  acceptsdangerous: "isDangerous",
  czyniebezpieczny: "isDangerous",
  isdangerous: "isDangerous",
  dangerous: "isDangerous",
  komentarz: "comment",
  comment: "comment",
}

const ITEM_HEADER_MAP: Record<string, string> = {
  name: "name",
  nazwa: "name",
  tempmin: "minTemp",
  mintemp: "minTemp",
  tempmax: "maxTemp",
  maxtemp: "maxTemp",
  waga: "weight",
  weight: "weight",
  szerokoscmm: "width",
  widthmm: "width",
  width: "width",
  wysokoscmm: "height",
  heightmm: "height",
  height: "height",
  glebokoscmm: "depth",
  depthmm: "depth",
  depth: "depth",
  terminwaznoscidni: "daysToExpiry",
  daystoexpiry: "daysToExpiry",
  expireafterdays: "daysToExpiry",
  czyniebezpieczny: "isDangerous",
  isdangerous: "isDangerous",
  dangerous: "isDangerous",
  komentarz: "comment",
  comment: "comment",
}

const RACK_FIELD_ORDER = [
  "marker",
  "rows",
  "cols",
  "minTemp",
  "maxTemp",
  "maxWeight",
  "maxItemWidth",
  "maxItemHeight",
  "maxItemDepth",
  "isDangerous",
  "comment",
] as const

const ITEM_FIELD_ORDER = [
  "name",
  "id",
  "minTemp",
  "maxTemp",
  "weight",
  "width",
  "height",
  "depth",
  "daysToExpiry",
  "isDangerous",
  "comment",
] as const

const RACK_PREVIEW_HEADERS = RACK_COLUMNS.map((column) => column.key)
const ITEM_PREVIEW_HEADERS = ITEM_COLUMNS.map((column) => column.key)
const WAREHOUSE_PREVIEW_HEADERS = WAREHOUSE_COLUMNS.map((column) => column.key)

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
    if (lower === "true" || lower === "1" || lower === "yes") {
      return true
    }
    if (lower === "false" || lower === "0" || lower === "no") {
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

function isFixedRowEmpty(row: unknown[]): boolean {
  return !row.some((cell) => String(cell ?? "").trim())
}

function appendParserErrors(
  errors: CsvParseError[],
  parserErrors: Papa.ParseError[],
  rowOffset: number
) {
  for (const error of parserErrors) {
    errors.push({
      row: (error.row ?? 0) + rowOffset,
      message: error.message,
    })
  }
}

function buildRawPreviewRow(
  previewHeaders: string[],
  values: string[]
): Record<string, string> {
  const rawRow: Record<string, string> = {}

  for (const [headerIndex, header] of previewHeaders.entries()) {
    rawRow[normalizeHeader(header)] = values[headerIndex] ?? ""
  }

  return rawRow
}

function mapFixedValuesToFields(
  fieldOrder: readonly string[],
  values: string[]
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  for (const [fieldIndex, field] of fieldOrder.entries()) {
    const coercedValue = coerceValue(values[fieldIndex] ?? "", field)
    if (coercedValue !== undefined) {
      mapped[field] = coercedValue
    }
  }

  return mapped
}

function mapValuesByHeaders(
  normalizedHeaders: string[],
  values: string[],
  headerMap: Record<string, string>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  for (const [headerIndex, header] of normalizedHeaders.entries()) {
    const field = headerMap[header]

    if (!field) {
      continue
    }

    const coercedValue = coerceValue(values[headerIndex] ?? "", field)
    if (coercedValue !== undefined) {
      mapped[field] = coercedValue
    }
  }

  return mapped
}

function isCommentedRow(firstValue: string): boolean {
  return firstValue.startsWith("#")
}

function extractNormalizedHeaders(values: string[]): string[] {
  return values.map((header, headerIndex) => {
    const value =
      headerIndex === 0 ? header.replace(COMMENT_PREFIX_REGEX, "") : header

    return normalizeHeader(value)
  })
}

function hasInvalidColumnCount(
  values: string[],
  minColumns: number,
  maxColumns: number
): boolean {
  return values.length < minColumns || values.length > maxColumns
}

function appendColumnCountError(
  errors: CsvParseError[],
  rowNumber: number,
  valueCount: number,
  minColumns: number,
  maxColumns: number
) {
  errors.push({
    row: rowNumber,
    message: `Nieprawidłowa liczba kolumn: ${valueCount}. Oczekiwano ${minColumns}-${maxColumns}.`,
  })
}

function appendValidatedRow<T extends "rack" | "item">(
  mapped: Record<string, unknown>,
  rowNumber: number,
  schema: typeof RackCsvSchema | typeof ItemCsvSchema,
  validRows: CsvRowType<T>[],
  errors: CsvParseError[]
) {
  const parsed = schema.safeParse(mapped)

  if (parsed.success) {
    validRows.push(parsed.data as CsvRowType<T>)
    return
  }

  appendSchemaIssues(errors, rowNumber, parsed.error.issues)
}

function getCommentedHeaderRow(
  values: string[],
  normalizedHeadersFromFile?: string[]
): string[] | undefined {
  const firstValue = values[0] ?? ""

  if (!isCommentedRow(firstValue) || normalizedHeadersFromFile) {
    return undefined
  }

  return extractNormalizedHeaders(values)
}

function appendHeaderMappedFixedRow<T extends "rack" | "item">(
  values: string[],
  rowNumber: number,
  normalizedHeaders: string[],
  headerMap: Record<string, string>,
  schema: typeof RackCsvSchema | typeof ItemCsvSchema,
  validRows: CsvRowType<T>[],
  rawRows: Record<string, string>[],
  errors: CsvParseError[]
) {
  rawRows.push(buildRawPreviewRow(normalizedHeaders, values))
  const mapped = mapValuesByHeaders(normalizedHeaders, values, headerMap)
  appendValidatedRow<T>(mapped, rowNumber, schema, validRows, errors)
}

function appendPositionalFixedRow<T extends "rack" | "item">(
  values: string[],
  rowNumber: number,
  fieldOrder: readonly string[],
  minColumns: number,
  maxColumns: number,
  previewHeaders: string[],
  schema: typeof RackCsvSchema | typeof ItemCsvSchema,
  validRows: CsvRowType<T>[],
  rawRows: Record<string, string>[],
  errors: CsvParseError[]
) {
  if (hasInvalidColumnCount(values, minColumns, maxColumns)) {
    appendColumnCountError(
      errors,
      rowNumber,
      values.length,
      minColumns,
      maxColumns
    )
    return
  }

  rawRows.push(buildRawPreviewRow(previewHeaders, values))
  const mapped = mapFixedValuesToFields(fieldOrder, values)
  appendValidatedRow<T>(mapped, rowNumber, schema, validRows, errors)
}

function parseFixedRows<T extends "rack" | "item">(
  rows: unknown[][],
  {
    fieldOrder,
    headerMap,
    maxColumns,
    minColumns,
    previewHeaders,
    schema,
  }: {
    fieldOrder: readonly string[]
    headerMap: Record<string, string>
    maxColumns: number
    minColumns: number
    previewHeaders: string[]
    schema: typeof RackCsvSchema | typeof ItemCsvSchema
  },
  errors: CsvParseError[]
): {
  headers: string[]
  rawRows: Record<string, string>[]
  validRows: CsvRowType<T>[]
} {
  const rawRows: Record<string, string>[] = []
  const validRows: CsvRowType<T>[] = []
  let normalizedHeadersFromFile: string[] | undefined

  for (const [index, row] of rows.entries()) {
    if (isFixedRowEmpty(row)) {
      continue
    }

    const values = row.map((cell) => String(cell ?? "").trim())
    const firstValue = values[0] ?? ""
    const rowNumber = index + 1
    const extractedHeaderRow = getCommentedHeaderRow(
      values,
      normalizedHeadersFromFile
    )

    if (extractedHeaderRow) {
      normalizedHeadersFromFile = extractedHeaderRow
      continue
    }

    if (isCommentedRow(firstValue)) {
      continue
    }

    if (normalizedHeadersFromFile) {
      appendHeaderMappedFixedRow<T>(
        values,
        rowNumber,
        normalizedHeadersFromFile,
        headerMap,
        schema,
        validRows,
        rawRows,
        errors
      )
      continue
    }

    appendPositionalFixedRow<T>(
      values,
      rowNumber,
      fieldOrder,
      minColumns,
      maxColumns,
      previewHeaders,
      schema,
      validRows,
      rawRows,
      errors
    )
  }

  return {
    headers: normalizedHeadersFromFile ?? previewHeaders,
    rawRows,
    validRows,
  }
}

function appendSchemaIssues(
  errors: CsvParseError[],
  rowNumber: number,
  issues: { path: PropertyKey[]; message: string }[]
) {
  for (const issue of issues) {
    errors.push({
      row: rowNumber,
      message: `${issue.path.map(String).join(".")}: ${issue.message}`,
    })
  }
}

function parseWarehouseCsv(file: File): Promise<CsvParseResult<"warehouse">> {
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      comments: "#",
      encoding: "UTF-8",
      delimiter: DEFAULT_CONFIG.delimiter,
      transformHeader: normalizeHeader,
      complete: (results) => {
        appendParserErrors(errors, results.errors, 2)

        const rawRows = results.data.filter((row) => !isRowEmpty(row))
        const validRows: CsvRowType<"warehouse">[] = []

        for (const [index, row] of rawRows.entries()) {
          const mapped = mapRow(row, WAREHOUSE_HEADER_MAP)
          const parsed = WarehouseCsvSchema.safeParse(mapped)

          if (parsed.success) {
            validRows.push(parsed.data)
            continue
          }

          const rowNumber = index + 2
          appendSchemaIssues(errors, rowNumber, parsed.error.issues)
        }

        resolve({
          headers: results.meta.fields ?? WAREHOUSE_PREVIEW_HEADERS,
          rows: validRows,
          rawRows,
          errors,
        })
      },
      error: reject,
    })
  })
}

function parseFixedCsv<T extends "rack" | "item">(
  file: File,
  {
    fieldOrder,
    headerMap,
    maxColumns,
    minColumns,
    previewHeaders,
    schema,
  }: {
    fieldOrder: readonly string[]
    headerMap: Record<string, string>
    maxColumns: number
    minColumns: number
    previewHeaders: string[]
    schema: typeof RackCsvSchema | typeof ItemCsvSchema
  }
): Promise<CsvParseResult<T>> {
  const errors: CsvParseError[] = []

  return new Promise((resolve, reject) => {
    Papa.parse<unknown[]>(file, {
      header: false,
      skipEmptyLines: true,
      encoding: "UTF-8",
      delimiter: DEFAULT_CONFIG.delimiter,
      complete: (results) => {
        appendParserErrors(errors, results.errors, 1)
        const { headers, rawRows, validRows } = parseFixedRows<T>(
          results.data,
          {
            fieldOrder,
            headerMap,
            maxColumns,
            minColumns,
            previewHeaders,
            schema,
          },
          errors
        )

        resolve({
          headers,
          rows: validRows,
          rawRows,
          errors,
        })
      },
      error: reject,
    })
  })
}

function parseRackCsv(file: File): Promise<CsvParseResult<"rack">> {
  return parseFixedCsv<"rack">(file, {
    fieldOrder: RACK_FIELD_ORDER,
    headerMap: RACK_HEADER_MAP,
    minColumns: 10,
    maxColumns: 12,
    previewHeaders: RACK_PREVIEW_HEADERS,
    schema: RackCsvSchema,
  })
}

function parseItemCsv(file: File): Promise<CsvParseResult<"item">> {
  return parseFixedCsv<"item">(file, {
    fieldOrder: ITEM_FIELD_ORDER,
    headerMap: ITEM_HEADER_MAP,
    minColumns: 9,
    maxColumns: 12,
    previewHeaders: ITEM_PREVIEW_HEADERS,
    schema: ItemCsvSchema,
  })
}

export function parseCsvFile<T extends CsvImporterType>(
  file: File,
  type: T
): Promise<CsvParseResult<T>> {
  if (type === "warehouse") {
    return parseWarehouseCsv(file) as Promise<CsvParseResult<T>>
  }
  if (type === "rack") {
    return parseRackCsv(file) as Promise<CsvParseResult<T>>
  }
  return parseItemCsv(file) as Promise<CsvParseResult<T>>
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "")
}
