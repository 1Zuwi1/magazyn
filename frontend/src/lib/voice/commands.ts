import { translateMessage } from "@/i18n/translate-message"
export type VoiceCommandId =
  | "dashboard"
  | "warehouses"
  | "warehouses:id"
  | "items"
  | "settings"
  | "open-scanner"
  | "add-item"
  | "search-product"
  | "search-assortment"
  | "notifications"
  | "alerts"
  | "admin-panel"
  | "inventory-check"

export interface VoiceCommand {
  id: VoiceCommandId
  description: string
  patterns: {
    regex: RegExp
    paramNames?: string[]
  }[]
  keywords?: string[]
}

export interface VoiceCommandMatch {
  command: VoiceCommand
  params: Record<string, string>
}

export const normalizeTranscript = (
  value: string,
  options?: { toLowerCase?: boolean }
): string => {
  const base = value
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  return options?.toLowerCase ? base.toLowerCase() : base
}

const IGNORED_PARAM_VALUES = new Set([
  "produkt",
  "produkty",
  "produktu",
  "przedmiot",
  "przedmioty",
  "przedmiotu",
  "asortyment",
  "asortymentu",
  "stan",
  "stanu",
  "regalu",
  "regal",
])

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "dashboard",
    description: translateMessage("generated.m0859"),
    patterns: [
      { regex: /^otworz dashboard$/i },
      { regex: /^przejdz do dashboard$/i },
      { regex: /^pokaz dashboard$/i },
      { regex: /^pokaz strone glowna$/i },
      { regex: /^przejdz do strony glownej$/i },
      { regex: /^strona glowna$/i },
      { regex: /^dashboard$/i },
    ],
    keywords: ["dashboard", "strona glowna", "panel glowny"],
  },
  {
    id: "warehouses",
    description: translateMessage("generated.m0860"),
    patterns: [{ regex: /^pokaz magazyny$/i }, { regex: /^otworz magazyny$/i }],
    keywords: ["magazyny"],
  },
  {
    id: "warehouses:id",
    description: translateMessage("generated.m0861"),
    patterns: [
      {
        regex: /^otworz magazyn ([a-z0-9 ]+)$/i,
        paramNames: ["warehouseName"],
      },
      {
        regex: /^pokaz magazyn ([a-z0-9 ]+)$/i,
        paramNames: ["warehouseName"],
      },
      {
        regex: /^magazyn ([a-z0-9 ]+)$/i,
        paramNames: ["warehouseName"],
      },
    ],
  },
  {
    id: "items",
    description: translateMessage("generated.m0862"),
    patterns: [
      { regex: /^pokaz produkty$/i },
      { regex: /^pokaz asortyment$/i },
      { regex: /^otworz produkty$/i },
      { regex: /^otworz asortyment$/i },
      { regex: /^pokaz przedmioty$/i },
      { regex: /^otworz przedmioty$/i },
      { regex: /^produkty$/i },
      { regex: /^asortyment$/i },
      { regex: /^przedmioty$/i },
    ],
    keywords: ["produkty", "asortyment", "przedmioty"],
  },
  {
    id: "settings",
    description: translateMessage("generated.m1010"),
    patterns: [{ regex: /^ustawienia$/i }, { regex: /^otworz ustawienia$/i }],
    keywords: ["ustawienia", "ustawien"],
  },
  {
    id: "open-scanner",
    description: translateMessage("generated.m0863"),
    patterns: [
      { regex: /^uruchom skaner$/i },
      { regex: /^otworz skaner$/i },
      { regex: /^odpal skaner$/i },
      { regex: /^skaner$/i },
      { regex: /^zdejmij produkt$/i },
      { regex: /^przyjmij produkt$/i },
    ],
    keywords: ["skaner"],
  },
  {
    id: "add-item",
    description: translateMessage("generated.m0864"),
    patterns: [
      { regex: /^dodaj produkt$/i },
      { regex: /^dodaj przedmiot$/i },
      { regex: /^dodaj asortyment$/i },
      { regex: /^nowy produkt$/i },
      { regex: /^nowy przedmiot$/i },
    ],
  },
  {
    id: "search-assortment",
    description: translateMessage("generated.m0865"),
    patterns: [
      {
        regex: /^znajdz asortyment ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^wyszukaj asortyment ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^szukaj asortymentu ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^gdzie jest asortyment ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
    ],
  },
  {
    id: "search-product",
    description: translateMessage("generated.m0754"),
    patterns: [
      {
        regex: /^znajdz produkt ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^wyszukaj produkt ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^szukaj produktu ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^znajdz przedmiot ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^wyszukaj przedmiot ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^szukaj przedmiotu ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^gdzie jest produkt ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^znajdz ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^wyszukaj ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^gdzie jest ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
    ],
  },
  {
    id: "notifications",
    description: translateMessage("generated.m0826"),
    patterns: [
      { regex: /^pokaz powiadomienia$/i },
      { regex: /^pokaz moje powiadomienia$/i },
      { regex: /^otworz powiadomienia$/i },
      { regex: /^otworz moje powiadomienia$/i },
      { regex: /^powiadomienia$/i },
      { regex: /^pokaz centrum powiadomien$/i },
      { regex: /^otworz centrum powiadomien$/i },
    ],
    keywords: ["powiadomienia", "centrum powiadomien"],
  },
  {
    id: "alerts",
    description: translateMessage("generated.m0866"),
    patterns: [
      { regex: /^pokaz alerty$/i },
      { regex: /^otworz alerty$/i },
      { regex: /^alerty$/i },
    ],
    keywords: ["alerty"],
  },
  {
    id: "admin-panel",
    description: translateMessage("generated.m0827"),
    patterns: [
      { regex: /^otworz panel administracyjny$/i },
      { regex: /^pokaz panel administracyjny$/i },
      { regex: /^przejdz do panelu administracyjnego$/i },
      { regex: /^panel administracyjny$/i },
    ],
    keywords: ["panel administracyjny", "admin"],
  },
  {
    id: "inventory-check",
    description: translateMessage("generated.m0867"),
    patterns: [
      {
        regex: /^sprawdz stan magazynu ([a-z0-9 ]+)$/i,
        paramNames: ["warehouseName"],
      },
      {
        regex: /^stan magazynu ([a-z0-9 ]+)$/i,
        paramNames: ["warehouseName"],
      },
      {
        regex: /^ile jest ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      {
        regex: /^sprawdz stan ([a-z0-9 ]+)$/i,
        paramNames: ["itemName"],
      },
      { regex: /^sprawdz stan magazynowy$/i },
      { regex: /^stan magazynowy$/i },
      { regex: /^sprawdz zapasy$/i },
    ],
  },
]

const NUMERIC_REGEX = /^[0-9 ]+$/

const extractParams = (
  match: RegExpMatchArray,
  paramNames?: string[]
): Record<string, string> | null => {
  if (!paramNames?.length) {
    return {}
  }

  const params: Record<string, string> = {}

  for (const [index, name] of paramNames.entries()) {
    const value = match[index + 1]
    if (!value) {
      continue
    }
    const normalizedValue = value.trim()
    if (IGNORED_PARAM_VALUES.has(normalizedValue.toLowerCase())) {
      return null
    }

    // Barcode speech transcription may insert spaces between digits.
    const isNumericWithOptionalSpaces = NUMERIC_REGEX.test(normalizedValue)
    params[name] = isNumericWithOptionalSpaces
      ? normalizedValue.replace(/\s+/g, "")
      : normalizedValue
  }

  return params
}

export const matchVoiceCommand = (
  transcript: string
): VoiceCommandMatch | null => {
  const normalized = normalizeTranscript(transcript)
  const normalizedLower = normalizeTranscript(transcript, { toLowerCase: true })

  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      const match = normalized.match(pattern.regex)
      if (!match) {
        continue
      }

      const params = extractParams(match, pattern.paramNames)
      if (!params) {
        continue
      }

      return { command, params }
    }
  }

  for (const command of VOICE_COMMANDS) {
    if (!command.keywords?.length) {
      continue
    }

    for (const keyword of command.keywords) {
      const keywordPattern = new RegExp(`(^| )${keyword}( |$)`, "i")
      if (keywordPattern.test(normalizedLower)) {
        return { command, params: {} }
      }
    }
  }

  return null
}
