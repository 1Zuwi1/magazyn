export const RACK_COLUMNS = [
  { key: "#oznaczenie", label: "Oznaczenie" },
  { key: "m", label: "M (Wiersze)" },
  { key: "n", label: "N (Kolumny)" },
  { key: "tempmin", label: "Temp. min." },
  { key: "tempmax", label: "Temp. max." },
  { key: "maxwagakg", label: "Max. waga (kg)" },
  { key: "maxszerokoscmm", label: "Max. szer. (mm)" },
  { key: "maxwysokoscmm", label: "Max. wys. (mm)" },
  { key: "maxglebokoscmm", label: "Max. głęb. (mm)" },
  { key: "komentarz", label: "Komentarz" },
] as const

export const ITEM_COLUMNS = [
  { key: "#nazwa", label: "Nazwa" },
  { key: "id", label: "ID" },
  { key: "zdjecie", label: "Zdjęcie" },
  { key: "tempmin", label: "Temp. min." },
  { key: "tempmax", label: "Temp. max." },
  { key: "waga", label: "Waga" },
  { key: "szerokoscmm", label: "Szer. (mm)" },
  { key: "wysokoscmm", label: "Wys. (mm)" },
  { key: "glebokoscmm", label: "Głęb. (mm)" },
  { key: "komentarz", label: "Komentarz" },
  { key: "terminwaznoscidni", label: "Termin ważności (dni)" },
  { key: "czyniebezpieczny", label: "Czy niebezpieczny" },
] as const

export const DEFAULT_CONFIG = {
  accept: { "text/csv": [".csv"] },
  maxFileCount: 1,
  delimiter: ",",
} as const

export const MAX_PREVIEW_ROWS = 10
