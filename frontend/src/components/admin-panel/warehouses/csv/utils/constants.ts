export const WAREHOUSE_COLUMNS = [
  { key: "name", label: "Nazwa magazynu" },
] as const

export const RACK_COLUMNS = [
  { key: "marker", label: "Oznaczenie" },
  { key: "m", label: "M (Wiersze)" },
  { key: "n", label: "N (Kolumny)" },
  { key: "tempmin", label: "Temp. min." },
  { key: "tempmax", label: "Temp. max." },
  { key: "maxwagakg", label: "Max. waga (kg)" },
  { key: "maxszerokoscmm", label: "Max. szer. (mm)" },
  { key: "maxwysokoscmm", label: "Max. wys. (mm)" },
  { key: "maxglebokoscmm", label: "Max. głęb. (mm)" },
  { key: "acceptsdangerous", label: "Czy niebezpieczny" },
  { key: "komentarz", label: "Komentarz" },
] as const

export const ITEM_COLUMNS = [
  { key: "nazwa", label: "Nazwa" },
  { key: "tempmin", label: "Temp. min." },
  { key: "tempmax", label: "Temp. max." },
  { key: "waga", label: "Waga" },
  { key: "szerokoscmm", label: "Szer. (mm)" },
  { key: "wysokoscmm", label: "Wys. (mm)" },
  { key: "glebokoscmm", label: "Głęb. (mm)" },
  { key: "terminwaznoscidni", label: "Termin ważności (dni)" },
  { key: "czyniebezpieczny", label: "Czy niebezpieczny" },
  { key: "komentarz", label: "Komentarz" },
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
