import { translateMessage } from "@/i18n/translate-message"
export const WAREHOUSE_COLUMNS = [
  { key: "name", label: translateMessage("generated.m0340") },
] as const

export const RACK_COLUMNS = [
  { key: "marker", label: translateMessage("generated.m0947") },
  { key: "m", label: translateMessage("generated.m0341") },
  { key: "n", label: translateMessage("generated.m0342") },
  { key: "tempmin", label: translateMessage("generated.m0343") },
  { key: "tempmax", label: translateMessage("generated.m0344") },
  { key: "maxwagakg", label: translateMessage("generated.m0345") },
  { key: "maxszerokoscmm", label: translateMessage("generated.m0346") },
  { key: "maxwysokoscmm", label: translateMessage("generated.m0347") },
  { key: "maxglebokoscmm", label: translateMessage("generated.m0348") },
  { key: "acceptsdangerous", label: translateMessage("generated.m0349") },
  { key: "komentarz", label: translateMessage("generated.m0930") },
] as const

export const ITEM_COLUMNS = [
  { key: "nazwa", label: translateMessage("generated.m0922") },
  { key: "tempmin", label: translateMessage("generated.m0343") },
  { key: "tempmax", label: translateMessage("generated.m0344") },
  { key: "waga", label: translateMessage("generated.m0948") },
  { key: "szerokoscmm", label: translateMessage("generated.m0350") },
  { key: "wysokoscmm", label: translateMessage("generated.m0351") },
  { key: "glebokoscmm", label: translateMessage("generated.m0352") },
  { key: "terminwaznoscidni", label: translateMessage("generated.m0353") },
  { key: "czyniebezpieczny", label: translateMessage("generated.m0349") },
  { key: "komentarz", label: translateMessage("generated.m0930") },
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
