import type { AppTranslate } from "@/i18n/use-translations"

const WAREHOUSE_COLUMN_KEYS = [
  {
    key: "name",
    labelKey: "generated.admin.warehouses.warehouseName",
  },
] as const

const RACK_COLUMN_KEYS = [
  {
    key: "marker",
    labelKey: "generated.admin.warehouses.designation",
  },
  { key: "m", labelKey: "generated.admin.warehouses.mPoems" },
  { key: "n", labelKey: "generated.admin.warehouses.nColumns" },
  {
    key: "tempmin",
    labelKey: "generated.admin.warehouses.tempMin",
  },
  {
    key: "tempmax",
    labelKey: "generated.admin.warehouses.tempMax",
  },
  {
    key: "maxwagakg",
    labelKey: "generated.admin.warehouses.maxWeightKg",
  },
  {
    key: "maxszerokoscmm",
    labelKey: "generated.admin.warehouses.maxWidthMm",
  },
  {
    key: "maxwysokoscmm",
    labelKey: "generated.admin.warehouses.maxHeightMm",
  },
  {
    key: "maxglebokoscmm",
    labelKey: "generated.admin.warehouses.maxDepthMm",
  },
  {
    key: "acceptsdangerous",
    labelKey: "generated.admin.warehouses.dangerous",
  },
  { key: "komentarz", labelKey: "generated.shared.comment" },
] as const

const ITEM_COLUMN_KEYS = [
  { key: "nazwa", labelKey: "generated.shared.name" },
  {
    key: "tempmin",
    labelKey: "generated.admin.warehouses.tempMin",
  },
  {
    key: "tempmax",
    labelKey: "generated.admin.warehouses.tempMax",
  },
  { key: "waga", labelKey: "generated.shared.weight" },
  {
    key: "szerokoscmm",
    labelKey: "generated.admin.warehouses.widthMm",
  },
  {
    key: "wysokoscmm",
    labelKey: "generated.admin.warehouses.heightMm",
  },
  {
    key: "glebokoscmm",
    labelKey: "generated.admin.warehouses.depthMm",
  },
  {
    key: "terminwaznoscidni",
    labelKey: "generated.admin.warehouses.expiryDateDays",
  },
  {
    key: "czyniebezpieczny",
    labelKey: "generated.admin.warehouses.dangerous",
  },
  { key: "komentarz", labelKey: "generated.shared.comment" },
] as const

const translateColumns = (
  t: AppTranslate,
  columns: ReadonlyArray<{ key: string; labelKey: string }>
): ReadonlyArray<{ key: string; label: string }> =>
  columns.map((column) => ({
    key: column.key,
    label: t(column.labelKey),
  }))

export const getWarehouseColumns = (t: AppTranslate) =>
  translateColumns(t, WAREHOUSE_COLUMN_KEYS)

export const getRackColumns = (t: AppTranslate) =>
  translateColumns(t, RACK_COLUMN_KEYS)

export const getItemColumns = (t: AppTranslate) =>
  translateColumns(t, ITEM_COLUMN_KEYS)

export const WAREHOUSE_PREVIEW_HEADERS = WAREHOUSE_COLUMN_KEYS.map(
  (column) => column.key
)
export const RACK_PREVIEW_HEADERS = RACK_COLUMN_KEYS.map((column) => column.key)
export const ITEM_PREVIEW_HEADERS = ITEM_COLUMN_KEYS.map((column) => column.key)

export const DEFAULT_CONFIG = {
  accept: {
    "application/csv": [".csv"],
    "text/csv": [".csv"],
    "text/plain": [".txt"],
  },
  maxFileCount: 1,
  maxSizeInBytes: 5 * 1024 * 1024,
  delimiter: ";",
} as const

export const MAX_PREVIEW_ROWS = 10
