import type {
  ExpiryReportRow,
  InventoryReportRow,
  ReportFormat,
  TemperatureReportRow,
} from "./types"

export const REPORT_FORMATS: { value: ReportFormat; label: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV (.csv)" },
]

export const EXPIRY_REPORT: ExpiryReportRow[] = [
  {
    id: "exp-1",
    item: "Mleko 3,2%",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    expiryDate: "2026-02-18",
    daysLeft: 8,
    batch: "B-2026-021",
  },
  {
    id: "exp-2",
    item: "Jogurt Grecki",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    expiryDate: "2026-02-12",
    daysLeft: 2,
    batch: "B-2026-022",
  },
  {
    id: "exp-3",
    item: "Sok Pomarańczowy",
    warehouse: "Magazyn Centralny",
    rack: "R-07B",
    expiryDate: "2026-03-05",
    daysLeft: 23,
    batch: "B-2026-019",
  },
  {
    id: "exp-4",
    item: "Sery Dojrzewające",
    warehouse: "Magazyn Północny",
    rack: "R-09D",
    expiryDate: "2026-02-14",
    daysLeft: 4,
    batch: "B-2026-015",
  },
]

export const TEMPERATURE_REPORT: TemperatureReportRow[] = [
  {
    id: "temp-1",
    scope: "RACK",
    targetRange: "2°C – 6°C",
    recordedTemp: "9°C",
    location: "R-12A / Magazyn Centralny",
    recordedAt: "2026-02-09 14:32",
  },
  {
    id: "temp-2",
    scope: "ASSORTMENT",
    targetRange: "-18°C – -12°C",
    recordedTemp: "-8°C",
    location: "R-03C / Magazyn Zachodni",
    recordedAt: "2026-02-09 09:18",
    item: "Lody waniliowe",
  },
  {
    id: "temp-3",
    scope: "RACK",
    targetRange: "10°C – 25°C",
    recordedTemp: "28°C",
    location: "R-05F / Magazyn Północny",
    recordedAt: "2026-02-08 21:04",
  },
  {
    id: "temp-4",
    scope: "ASSORTMENT",
    targetRange: "2°C – 6°C",
    recordedTemp: "7°C",
    location: "R-07B / Magazyn Centralny",
    recordedAt: "2026-02-08 18:26",
    item: "Jogurt Grecki",
  },
]

export const INVENTORY_REPORT: InventoryReportRow[] = [
  {
    id: "inv-1",
    item: "Mleko 3,2%",
    sku: "SKU-MLK-32",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    quantity: 240,
    unit: "szt.",
    status: "OK",
  },
  {
    id: "inv-2",
    item: "Jogurt Grecki",
    sku: "SKU-JGR-01",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    quantity: 48,
    unit: "szt.",
    status: "LOW",
  },
  {
    id: "inv-3",
    item: "Lody waniliowe",
    sku: "SKU-LDY-07",
    warehouse: "Magazyn Centralny",
    rack: "R-02B",
    quantity: 520,
    unit: "szt.",
    status: "OVERSTOCK",
  },
  {
    id: "inv-4",
    item: "Sok Pomarańczowy",
    sku: "SKU-SKP-05",
    warehouse: "Magazyn Północny",
    rack: "R-07B",
    quantity: 130,
    unit: "szt.",
    status: "OK",
  },
]

export const formatDate = (value: string) => {
  const [year, month, day] = value.split("-")
  return `${day}.${month}.${year}`
}

export const getExpiryStatus = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return { label: "Przeterminowane", variant: "destructive" as const }
  }
  if (daysLeft <= 3) {
    return { label: "Krytyczne", variant: "destructive" as const }
  }
  if (daysLeft <= 10) {
    return { label: "Wkrótce wygasa", variant: "warning" as const }
  }
  return { label: "W normie", variant: "success" as const }
}
