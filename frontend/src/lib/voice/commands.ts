import {
  type AppLocale,
  DEFAULT_APP_LOCALE,
  getClientAppLocale,
} from "@/i18n/locale"
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

interface VoiceCommandPattern {
  regex: RegExp
  paramNames?: string[]
}

export interface VoiceCommand {
  id: VoiceCommandId
  description: string
  patterns: VoiceCommandPattern[]
  keywords?: string[]
}

export interface VoiceCommandMatch {
  command: VoiceCommand
  params: Record<string, string>
}

interface CommandDefinition {
  patterns: VoiceCommandPattern[]
  keywords?: string[]
}

type LocalizedCommandDefinitions = Record<VoiceCommandId, CommandDefinition>

const COMMAND_IDS: VoiceCommandId[] = [
  "dashboard",
  "warehouses",
  "warehouses:id",
  "items",
  "settings",
  "open-scanner",
  "add-item",
  "search-assortment",
  "search-product",
  "notifications",
  "alerts",
  "admin-panel",
  "inventory-check",
]

const COMMAND_DESCRIPTION_KEYS: Readonly<Record<VoiceCommandId, string>> = {
  dashboard: "generated.voiceAssistant.openDashboard",
  warehouses: "generated.voiceAssistant.showWarehouses",
  "warehouses:id": "generated.voiceAssistant.openWarehouseGivenName",
  items: "generated.voiceAssistant.showProducts",
  settings: "generated.shared.settings",
  "open-scanner": "generated.voiceAssistant.launchScanner",
  "add-item": "generated.voiceAssistant.addProduct",
  "search-product": "generated.shared.searchProduct",
  "search-assortment": "generated.voiceAssistant.searchAssortment",
  notifications: "generated.voiceAssistant.showNotifications",
  alerts: "generated.voiceAssistant.showAlerts",
  "admin-panel": "generated.voiceAssistant.openAdministrationPanel",
  "inventory-check": "generated.voiceAssistant.checkStock",
}

const COMMAND_DEFINITIONS_BY_LOCALE: Readonly<
  Record<AppLocale, LocalizedCommandDefinitions>
> = {
  pl: {
    dashboard: {
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
    warehouses: {
      patterns: [
        { regex: /^pokaz magazyny$/i },
        { regex: /^otworz magazyny$/i },
      ],
      keywords: ["magazyny"],
    },
    "warehouses:id": {
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
    items: {
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
    settings: {
      patterns: [{ regex: /^ustawienia$/i }, { regex: /^otworz ustawienia$/i }],
      keywords: ["ustawienia", "ustawien"],
    },
    "open-scanner": {
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
    "add-item": {
      patterns: [
        { regex: /^dodaj produkt$/i },
        { regex: /^dodaj przedmiot$/i },
        { regex: /^dodaj asortyment$/i },
        { regex: /^nowy produkt$/i },
        { regex: /^nowy przedmiot$/i },
      ],
    },
    "search-product": {
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
    "search-assortment": {
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
    notifications: {
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
    alerts: {
      patterns: [
        { regex: /^pokaz alerty$/i },
        { regex: /^otworz alerty$/i },
        { regex: /^alerty$/i },
      ],
      keywords: ["alerty"],
    },
    "admin-panel": {
      patterns: [
        { regex: /^otworz panel administracyjny$/i },
        { regex: /^pokaz panel administracyjny$/i },
        { regex: /^przejdz do panelu administracyjnego$/i },
        { regex: /^panel administracyjny$/i },
      ],
      keywords: ["panel administracyjny", "admin"],
    },
    "inventory-check": {
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
  },
  en: {
    dashboard: {
      patterns: [
        { regex: /^open dashboard$/i },
        { regex: /^go to dashboard$/i },
        { regex: /^show dashboard$/i },
        { regex: /^show home page$/i },
        { regex: /^go to home page$/i },
        { regex: /^home page$/i },
        { regex: /^dashboard$/i },
      ],
      keywords: ["dashboard", "home page", "main panel"],
    },
    warehouses: {
      patterns: [
        { regex: /^show warehouses$/i },
        { regex: /^open warehouses$/i },
      ],
      keywords: ["warehouses"],
    },
    "warehouses:id": {
      patterns: [
        {
          regex: /^open warehouse ([a-z0-9 ]+)$/i,
          paramNames: ["warehouseName"],
        },
        {
          regex: /^show warehouse ([a-z0-9 ]+)$/i,
          paramNames: ["warehouseName"],
        },
        {
          regex: /^warehouse ([a-z0-9 ]+)$/i,
          paramNames: ["warehouseName"],
        },
      ],
    },
    items: {
      patterns: [
        { regex: /^show products$/i },
        { regex: /^show assortment$/i },
        { regex: /^open products$/i },
        { regex: /^open assortment$/i },
        { regex: /^show items$/i },
        { regex: /^open items$/i },
        { regex: /^products$/i },
        { regex: /^assortment$/i },
        { regex: /^items$/i },
      ],
      keywords: ["products", "assortment", "items"],
    },
    settings: {
      patterns: [{ regex: /^settings$/i }, { regex: /^open settings$/i }],
      keywords: ["settings"],
    },
    "open-scanner": {
      patterns: [
        { regex: /^launch scanner$/i },
        { regex: /^open scanner$/i },
        { regex: /^start scanner$/i },
        { regex: /^scanner$/i },
        { regex: /^scan product$/i },
        { regex: /^receive product$/i },
      ],
      keywords: ["scanner"],
    },
    "add-item": {
      patterns: [
        { regex: /^add product$/i },
        { regex: /^add item$/i },
        { regex: /^add assortment$/i },
        { regex: /^new product$/i },
        { regex: /^new item$/i },
      ],
    },
    "search-product": {
      patterns: [
        {
          regex: /^find product ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^search product ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^look for product ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^find item ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^search item ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^look for item ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^where is product ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^find ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^search ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^where is ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
      ],
    },
    "search-assortment": {
      patterns: [
        {
          regex: /^find assortment ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^search assortment ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^look for assortment ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^where is assortment ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
      ],
    },
    notifications: {
      patterns: [
        { regex: /^show notifications$/i },
        { regex: /^show my notifications$/i },
        { regex: /^open notifications$/i },
        { regex: /^open my notifications$/i },
        { regex: /^notifications$/i },
        { regex: /^show notification center$/i },
        { regex: /^open notification center$/i },
      ],
      keywords: ["notifications", "notification center"],
    },
    alerts: {
      patterns: [
        { regex: /^show alerts$/i },
        { regex: /^open alerts$/i },
        { regex: /^alerts$/i },
      ],
      keywords: ["alerts"],
    },
    "admin-panel": {
      patterns: [
        { regex: /^open admin panel$/i },
        { regex: /^show admin panel$/i },
        { regex: /^go to admin panel$/i },
        { regex: /^admin panel$/i },
      ],
      keywords: ["admin panel", "admin"],
    },
    "inventory-check": {
      patterns: [
        {
          regex: /^check warehouse stock ([a-z0-9 ]+)$/i,
          paramNames: ["warehouseName"],
        },
        {
          regex: /^warehouse stock ([a-z0-9 ]+)$/i,
          paramNames: ["warehouseName"],
        },
        {
          regex: /^how many ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        {
          regex: /^check stock ([a-z0-9 ]+)$/i,
          paramNames: ["itemName"],
        },
        { regex: /^check inventory$/i },
        { regex: /^inventory status$/i },
        { regex: /^check stock levels$/i },
      ],
    },
  },
}

const resolveCurrentLocale = (): AppLocale => {
  if (typeof document !== "undefined") {
    return getClientAppLocale()
  }

  return DEFAULT_APP_LOCALE
}

const buildVoiceCommands = (locale: AppLocale): VoiceCommand[] =>
  COMMAND_IDS.map((id) => {
    const commandDefinition = COMMAND_DEFINITIONS_BY_LOCALE[locale][id]

    return {
      id,
      description: translateMessage(
        COMMAND_DESCRIPTION_KEYS[id],
        undefined,
        locale
      ),
      patterns: commandDefinition.patterns,
      keywords: commandDefinition.keywords,
    }
  })

const VOICE_COMMANDS_BY_LOCALE: Readonly<Record<AppLocale, VoiceCommand[]>> = {
  en: buildVoiceCommands("en"),
  pl: buildVoiceCommands("pl"),
}

export const VOICE_COMMANDS: VoiceCommand[] =
  VOICE_COMMANDS_BY_LOCALE[DEFAULT_APP_LOCALE]

const IGNORED_PARAM_VALUES_BY_LOCALE: Readonly<Record<AppLocale, Set<string>>> =
  {
    pl: new Set([
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
    ]),
    en: new Set([
      "product",
      "products",
      "item",
      "items",
      "assortment",
      "stock",
      "warehouse",
      "inventory",
    ]),
  }

const NUMERIC_REGEX = /^[0-9 ]+$/

const extractParams = (
  match: RegExpMatchArray,
  ignoredParamValues: Set<string>,
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
    if (ignoredParamValues.has(normalizedValue.toLowerCase())) {
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

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const matchVoiceCommand = (
  transcript: string
): VoiceCommandMatch | null => {
  const normalized = normalizeTranscript(transcript)
  const normalizedLower = normalizeTranscript(transcript, { toLowerCase: true })
  const locale = resolveCurrentLocale()
  const voiceCommands = VOICE_COMMANDS_BY_LOCALE[locale]
  const ignoredParamValues = IGNORED_PARAM_VALUES_BY_LOCALE[locale]

  for (const command of voiceCommands) {
    for (const pattern of command.patterns) {
      const match = normalized.match(pattern.regex)
      if (!match) {
        continue
      }

      const params = extractParams(
        match,
        ignoredParamValues,
        pattern.paramNames
      )
      if (!params) {
        continue
      }

      return { command, params }
    }
  }

  for (const command of voiceCommands) {
    if (!command.keywords?.length) {
      continue
    }

    for (const keyword of command.keywords) {
      const keywordPattern = new RegExp(
        `(^| )${escapeRegex(keyword)}( |$)`,
        "i"
      )
      if (keywordPattern.test(normalizedLower)) {
        return { command, params: {} }
      }
    }
  }

  return null
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
