export const RACK_COLUMNS = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Nazwa" },
  { key: "rows", label: "Wiersze" },
  { key: "cols", label: "Kolumny" },
  { key: "mintemp", label: "Min. temp." },
  { key: "maxtemp", label: "Max. temp." },
  { key: "maxweight", label: "Max. waga" },
  { key: "maxitemwidth", label: "Max. szer." },
  { key: "maxitemheight", label: "Max. wys." },
  { key: "maxitemdepth", label: "Max. głęb." },
  { key: "comment", label: "Komentarz" },
] as const

export const ITEM_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nazwa" },
  { key: "imageurl", label: "URL obrazka" },
  { key: "mintemp", label: "Min. temp." },
  { key: "maxtemp", label: "Max. temp." },
  { key: "weight", label: "Waga" },
  { key: "width", label: "Szerokość" },
  { key: "height", label: "Wysokość" },
  { key: "depth", label: "Głębokość" },
  { key: "comment", label: "Komentarz" },
  { key: "daystoexpiry", label: "Dni do wygaśnięcia" },
  { key: "isdangerous", label: "Niebezpieczny" },
] as const

export const DEFAULT_CONFIG = {
  accept: { "text/csv": [".csv"] },
  maxSize: 1024 * 1024 * 4,
  maxFileCount: 1,
  delimiter: ",",
} as const

export const MAX_PREVIEW_ROWS = 10
