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

export const WAREHOUSES = [
  "Magazyn Centralny",
  "Magazyn Zachodni",
  "Magazyn Północny",
] as const

export const EXPIRY_REPORT: ExpiryReportRow[] = [
  {
    id: "exp-1",
    item: "Mleko 3,2%",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    expiryDate: "2026-02-18",
    daysLeft: 8,
    batch: "B-2026-021",
    quantity: 120,
    unit: "szt.",
    category: "Nabiał",
  },
  {
    id: "exp-2",
    item: "Jogurt Grecki",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    expiryDate: "2026-02-12",
    daysLeft: 2,
    batch: "B-2026-022",
    quantity: 48,
    unit: "szt.",
    category: "Nabiał",
  },
  {
    id: "exp-3",
    item: "Sok Pomarańczowy",
    warehouse: "Magazyn Centralny",
    rack: "R-07B",
    expiryDate: "2026-03-05",
    daysLeft: 23,
    batch: "B-2026-019",
    quantity: 200,
    unit: "szt.",
    category: "Napoje",
  },
  {
    id: "exp-4",
    item: "Sery Dojrzewające",
    warehouse: "Magazyn Północny",
    rack: "R-09D",
    expiryDate: "2026-02-14",
    daysLeft: 4,
    batch: "B-2026-015",
    quantity: 35,
    unit: "kg",
    category: "Nabiał",
  },
  {
    id: "exp-5",
    item: "Masło Extra",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    expiryDate: "2026-02-11",
    daysLeft: 1,
    batch: "B-2026-030",
    quantity: 80,
    unit: "szt.",
    category: "Nabiał",
  },
  {
    id: "exp-6",
    item: "Filet z kurczaka",
    warehouse: "Magazyn Zachodni",
    rack: "R-01A",
    expiryDate: "2026-02-13",
    daysLeft: 3,
    batch: "B-2026-028",
    quantity: 60,
    unit: "kg",
    category: "Mięso",
  },
  {
    id: "exp-7",
    item: "Śmietana 18%",
    warehouse: "Magazyn Północny",
    rack: "R-04B",
    expiryDate: "2026-02-20",
    daysLeft: 10,
    batch: "B-2026-033",
    quantity: 150,
    unit: "szt.",
    category: "Nabiał",
  },
  {
    id: "exp-8",
    item: "Lody waniliowe",
    warehouse: "Magazyn Centralny",
    rack: "R-02B",
    expiryDate: "2026-04-15",
    daysLeft: 64,
    batch: "B-2026-011",
    quantity: 300,
    unit: "szt.",
    category: "Mrożonki",
  },
  {
    id: "exp-9",
    item: "Kiełbasa Krakowska",
    warehouse: "Magazyn Północny",
    rack: "R-06C",
    expiryDate: "2026-02-10",
    daysLeft: 0,
    batch: "B-2026-025",
    quantity: 25,
    unit: "kg",
    category: "Mięso",
  },
  {
    id: "exp-10",
    item: "Twaróg półtłusty",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    expiryDate: "2026-02-16",
    daysLeft: 6,
    batch: "B-2026-035",
    quantity: 90,
    unit: "szt.",
    category: "Nabiał",
  },
]

export const TEMPERATURE_REPORT: TemperatureReportRow[] = [
  {
    id: "temp-1",
    scope: "RACK",
    targetRange: "2°C – 6°C",
    recordedTemp: "9°C",
    location: "R-12A",
    warehouse: "Magazyn Centralny",
    recordedAt: "2026-02-09 14:32",
    severity: "CRITICAL",
    deviation: 3,
  },
  {
    id: "temp-2",
    scope: "ASSORTMENT",
    targetRange: "-18°C – -12°C",
    recordedTemp: "-8°C",
    location: "R-03C",
    warehouse: "Magazyn Zachodni",
    recordedAt: "2026-02-09 09:18",
    item: "Lody waniliowe",
    severity: "CRITICAL",
    deviation: 4,
  },
  {
    id: "temp-3",
    scope: "RACK",
    targetRange: "10°C – 25°C",
    recordedTemp: "28°C",
    location: "R-05F",
    warehouse: "Magazyn Północny",
    recordedAt: "2026-02-08 21:04",
    severity: "WARNING",
    deviation: 3,
  },
  {
    id: "temp-4",
    scope: "ASSORTMENT",
    targetRange: "2°C – 6°C",
    recordedTemp: "7°C",
    location: "R-07B",
    warehouse: "Magazyn Centralny",
    recordedAt: "2026-02-08 18:26",
    item: "Jogurt Grecki",
    severity: "MINOR",
    deviation: 1,
  },
  {
    id: "temp-5",
    scope: "RACK",
    targetRange: "-20°C – -15°C",
    recordedTemp: "-10°C",
    location: "R-01A",
    warehouse: "Magazyn Zachodni",
    recordedAt: "2026-02-09 22:15",
    severity: "CRITICAL",
    deviation: 5,
  },
  {
    id: "temp-6",
    scope: "ASSORTMENT",
    targetRange: "2°C – 8°C",
    recordedTemp: "10°C",
    location: "R-04B",
    warehouse: "Magazyn Północny",
    recordedAt: "2026-02-09 06:42",
    item: "Masło Extra",
    severity: "WARNING",
    deviation: 2,
  },
  {
    id: "temp-7",
    scope: "RACK",
    targetRange: "0°C – 4°C",
    recordedTemp: "6°C",
    location: "R-09D",
    warehouse: "Magazyn Północny",
    recordedAt: "2026-02-10 03:18",
    severity: "WARNING",
    deviation: 2,
  },
]

export const INVENTORY_REPORT: InventoryReportRow[] = [
  {
    id: "inv-1",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    item: "Mleko 3,2%",
    sku: "SKU-MLK-32",
    quantity: 240,
    unit: "szt.",
    nearestExpiry: "2026-02-18",
  },
  {
    id: "inv-2",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    item: "Jogurt Grecki",
    sku: "SKU-JGR-01",
    quantity: 48,
    unit: "szt.",
    nearestExpiry: "2026-02-12",
  },
  {
    id: "inv-3",
    warehouse: "Magazyn Centralny",
    rack: "R-02B",
    item: "Lody waniliowe",
    sku: "SKU-LDY-07",
    quantity: 520,
    unit: "szt.",
    nearestExpiry: "2026-04-15",
  },
  {
    id: "inv-4",
    warehouse: "Magazyn Północny",
    rack: "R-07B",
    item: "Sok Pomarańczowy",
    sku: "SKU-SKP-05",
    quantity: 130,
    unit: "szt.",
    nearestExpiry: "2026-03-05",
  },
  {
    id: "inv-5",
    warehouse: "Magazyn Centralny",
    rack: "R-12A",
    item: "Masło Extra",
    sku: "SKU-MSL-01",
    quantity: 180,
    unit: "szt.",
    nearestExpiry: "2026-02-11",
  },
  {
    id: "inv-6",
    warehouse: "Magazyn Zachodni",
    rack: "R-01A",
    item: "Filet z kurczaka",
    sku: "SKU-FLK-02",
    quantity: 35,
    unit: "kg",
    nearestExpiry: "2026-02-13",
  },
  {
    id: "inv-7",
    warehouse: "Magazyn Północny",
    rack: "R-09D",
    item: "Sery Dojrzewające",
    sku: "SKU-SRD-03",
    quantity: 85,
    unit: "kg",
    nearestExpiry: "2026-02-14",
  },
  {
    id: "inv-8",
    warehouse: "Magazyn Północny",
    rack: "R-06C",
    item: "Kiełbasa Krakowska",
    sku: "SKU-KKR-04",
    quantity: 42,
    unit: "kg",
    nearestExpiry: "2026-02-10",
  },
  {
    id: "inv-9",
    warehouse: "Magazyn Północny",
    rack: "R-04B",
    item: "Śmietana 18%",
    sku: "SKU-SMT-18",
    quantity: 310,
    unit: "szt.",
    nearestExpiry: "2026-02-20",
  },
  {
    id: "inv-10",
    warehouse: "Magazyn Zachodni",
    rack: "R-03C",
    item: "Twaróg półtłusty",
    sku: "SKU-TWR-06",
    quantity: 95,
    unit: "szt.",
    nearestExpiry: null,
  },
]

export const formatDate = (value: string) => {
  const [year, month, day] = value.split("-")
  return `${day}.${month}.${year}`
}

export const formatDateTime = (value: string) => {
  const [date, time] = value.split(" ")
  return `${formatDate(date)}, ${time}`
}

export const getExpiryStatus = (daysLeft: number) => {
  let daysText: string
  if (daysLeft <= 0) {
    daysText = `${Math.abs(daysLeft)} dn. po terminie`
  } else if (daysLeft === 1) {
    daysText = "1 dzień"
  } else {
    daysText = `${daysLeft} dni`
  }

  if (daysLeft <= 0) {
    return {
      label: "Przeterminowane",
      variant: "destructive" as const,
      daysText,
    }
  }
  if (daysLeft <= 3) {
    return { label: "Krytyczne", variant: "destructive" as const, daysText }
  }
  if (daysLeft <= 10) {
    return { label: "Wkrótce wygasa", variant: "warning" as const, daysText }
  }
  return { label: "W normie", variant: "success" as const, daysText }
}

export const getSeverityConfig = (severity: string) => {
  if (severity === "CRITICAL") {
    return {
      label: "Krytyczne",
      variant: "destructive" as const,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    }
  }
  if (severity === "WARNING") {
    return {
      label: "Ostrzeżenie",
      variant: "warning" as const,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
    }
  }
  return {
    label: "Drobne",
    variant: "secondary" as const,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  }
}
