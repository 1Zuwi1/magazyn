import { translateMessage } from "@/i18n/translate-message"
export const WAREHOUSE_COLUMNS = [
  {
    key: "name",
    label: translateMessage("generated.admin.warehouses.warehouseName"),
  },
] as const

export const RACK_COLUMNS = [
  {
    key: "marker",
    label: translateMessage("generated.admin.warehouses.designation"),
  },
  { key: "m", label: translateMessage("generated.admin.warehouses.mPoems") },
  { key: "n", label: translateMessage("generated.admin.warehouses.nColumns") },
  {
    key: "tempmin",
    label: translateMessage("generated.admin.warehouses.tempMin"),
  },
  {
    key: "tempmax",
    label: translateMessage("generated.admin.warehouses.tempMax"),
  },
  {
    key: "maxwagakg",
    label: translateMessage("generated.admin.warehouses.maxWeightKg"),
  },
  {
    key: "maxszerokoscmm",
    label: translateMessage("generated.admin.warehouses.maxWidthMm"),
  },
  {
    key: "maxwysokoscmm",
    label: translateMessage("generated.admin.warehouses.maxHeightMm"),
  },
  {
    key: "maxglebokoscmm",
    label: translateMessage("generated.admin.warehouses.maxDepthMm"),
  },
  {
    key: "acceptsdangerous",
    label: translateMessage("generated.admin.warehouses.dangerous"),
  },
  { key: "komentarz", label: translateMessage("generated.shared.comment") },
] as const

export const ITEM_COLUMNS = [
  { key: "nazwa", label: translateMessage("generated.shared.name") },
  {
    key: "tempmin",
    label: translateMessage("generated.admin.warehouses.tempMin"),
  },
  {
    key: "tempmax",
    label: translateMessage("generated.admin.warehouses.tempMax"),
  },
  { key: "waga", label: translateMessage("generated.shared.weight") },
  {
    key: "szerokoscmm",
    label: translateMessage("generated.admin.warehouses.widthMm"),
  },
  {
    key: "wysokoscmm",
    label: translateMessage("generated.admin.warehouses.heightMm"),
  },
  {
    key: "glebokoscmm",
    label: translateMessage("generated.admin.warehouses.depthMm"),
  },
  {
    key: "terminwaznoscidni",
    label: translateMessage("generated.admin.warehouses.expiryDateDays"),
  },
  {
    key: "czyniebezpieczny",
    label: translateMessage("generated.admin.warehouses.dangerous"),
  },
  { key: "komentarz", label: translateMessage("generated.shared.comment") },
] as const

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
