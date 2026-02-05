export type VoiceCommandId =
  | "dashboard"
  | "warehouses"
  | "warehouses:id"
  | "items"
  | "settings"
  | "open-scanner"
  | "add-item"

export interface VoiceCommand {
  id: VoiceCommandId
  description: string
  patterns: {
    regex: RegExp
    paramNames?: string[]
  }[]
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
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  return options?.toLowerCase ? base.toLowerCase() : base
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "dashboard",
    description: "Otwórz dashboard",
    patterns: [
      { regex: /^otworz dashboard$/ },
      { regex: /^przejdz do dashboard$/ },
      { regex: /^pokaz dashboard$/ },
      { regex: /^pokaz strone glowna$/ },
    ],
  },
  {
    id: "warehouses",
    description: "Pokaż magazyny",
    patterns: [{ regex: /^pokaz magazyny$/ }, { regex: /^otworz magazyny$/ }],
  },
  {
    id: "warehouses:id",
    description: "Otwórz magazyn o podanej nazwie",
    patterns: [
      {
        regex: /^otworz magazyn ([a-z0-9 ]+)$/,
        paramNames: ["warehouseName"],
      },
      {
        regex: /^pokaz magazyn ([a-z0-9 ]+)$/,
        paramNames: ["warehouseName"],
      },
    ],
  },
  {
    id: "items",
    description: "Pokaż produkty",
    patterns: [
      { regex: /^pokaz produkty$/ },
      { regex: /^pokaz asortyment$/ },
      { regex: /^otworz produkty$/ },
      { regex: /^otworz asortyment$/ },
      { regex: /^pokaz przedmioty$/ },
      { regex: /^otworz przedmioty$/ },
    ],
  },
  {
    id: "settings",
    description: "Ustawienia",
    patterns: [{ regex: /^ustawienia$/ }, { regex: /^otworz ustawienia$/ }],
  },
  {
    id: "open-scanner",
    description: "Uruchom skaner",
    patterns: [{ regex: /^uruchom skaner$/ }, { regex: /^otworz skaner$/ }],
  },
  {
    id: "add-item",
    description: "Dodaj produkt",
    patterns: [{ regex: /^dodaj produkt$/ }, { regex: /^dodaj przedmiot$/ }],
  },
]

export const matchVoiceCommand = (
  transcript: string
): VoiceCommandMatch | null => {
  const normalized = normalizeTranscript(transcript)
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      const match = normalized.match(toCaseInsensitive(pattern.regex))
      if (!match) {
        continue
      }

      const params: Record<string, string> = {}
      if (pattern.paramNames?.length) {
        for (const [index, name] of pattern.paramNames.entries()) {
          const value = match[index + 1]
          if (value) {
            params[name] = value
          }
        }
      }

      return { command, params }
    }
  }
  return null
}

const toCaseInsensitive = (regex: RegExp): RegExp => {
  const flags = regex.flags.includes("i") ? regex.flags : `${regex.flags}i`
  return new RegExp(regex.source, flags)
}
