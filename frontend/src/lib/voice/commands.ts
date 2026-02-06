export type VoiceCommandId =
  | "dashboard"
  | "warehouses"
  | "warehouses:id"
  | "items"
  | "settings"
  | "open-scanner"
  | "add-item"
  | "delete-item"

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
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
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
      { regex: /^otworz dashboard$/i },
      { regex: /^przejdz do dashboard$/i },
      { regex: /^pokaz dashboard$/i },
      { regex: /^pokaz strone glowna$/i },
      { regex: /^przejdz do strony glownej$/i },
      { regex: /^strona glowna$/i },
      { regex: /^dashboard$/i },
    ],
  },
  {
    id: "warehouses",
    description: "Pokaż magazyny",
    patterns: [{ regex: /^pokaz magazyny$/i }, { regex: /^otworz magazyny$/i }],
  },
  {
    id: "warehouses:id",
    description: "Otwórz magazyn o podanej nazwie",
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
    description: "Pokaż produkty",
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
  },
  {
    id: "settings",
    description: "Ustawienia",
    patterns: [{ regex: /^ustawienia$/i }, { regex: /^otworz ustawienia$/i }],
  },
  {
    id: "open-scanner",
    description: "Uruchom skaner",
    patterns: [
      { regex: /^uruchom skaner$/i },
      { regex: /^otworz skaner$/i },
      { regex: /^odpal skaner$/i },
      { regex: /^skaner$/i },
    ],
  },
  {
    id: "add-item",
    description: "Dodaj produkt",
    patterns: [
      { regex: /^dodaj produkt$/i },
      { regex: /^dodaj przedmiot$/i },
      { regex: /^dodaj asortyment$/i },
      { regex: /^nowy produkt$/i },
      { regex: /^nowy przedmiot$/i },
    ],
  },
  {
    id: "delete-item",
    description: "Usuń produkt",
    patterns: [
      { regex: /^usun produkt ([a-z0-9]+)$/i },
      { regex: /^usun przedmiot ([a-z0-9]+)$/i },
      { regex: /^usun asortyment ([a-z0-9]+)$/i },
    ],
  },
]

export const matchVoiceCommand = (
  transcript: string
): VoiceCommandMatch | null => {
  const normalized = normalizeTranscript(transcript)
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      const match = normalized.match(pattern.regex)
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
