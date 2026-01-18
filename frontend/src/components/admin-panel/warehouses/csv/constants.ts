export const RACK_COLUMNS = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Nazwa" },
  { key: "rows", label: "Wiersze" },
  { key: "cols", label: "Kolumny" },
  { key: "mintemp", label: "Min. temp." },
  { key: "maxtemp", label: "Max. temp." },
  { key: "maxweight", label: "Max. waga" },
] as const

export const ITEM_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nazwa" },
  { key: "mintemp", label: "Min. temp." },
  { key: "maxtemp", label: "Max. temp." },
  { key: "weight", label: "Waga" },
  { key: "daystoexpiry", label: "Dni do wygaśnięcia" },
] as const

export const DEFAULT_CONFIG = {
  accept: { "text/csv": [".csv"] },
  maxSize: 1024 * 1024 * 4,
  maxFileCount: 1,
} as const

export const MAX_PREVIEW_ROWS = 10
