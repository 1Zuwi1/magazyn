export type VoiceCommandId =
  | "dashboard"
  | "warehouses"
  | "items"
  | "settings"
  | "open-scanner"
  | "add-item"

export interface VoiceCommand {
  id: VoiceCommandId
  description: string
  patterns: RegExp[]
}

export const normalizeTranscript = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: "dashboard",
    description: "Otwórz dashboard",
    patterns: [
      /^otworz dashboard$/,
      /^przejdz do dashboard$/,
      /^pokaz dashboard$/,
      /^pokaz strone glowna$/,
    ],
  },
  {
    id: "warehouses",
    description: "Pokaż magazyny",
    patterns: [/^pokaz magazyny$/, /^otworz magazyny$/],
  },
  {
    id: "items",
    description: "Pokaż produkty",
    patterns: [/^pokaz produkty$/, /^pokaz asortyment$/],
  },
  {
    id: "settings",
    description: "Ustawienia",
    patterns: [/^ustawienia$/, /^otworz ustawienia$/],
  },
  {
    id: "open-scanner",
    description: "Uruchom skaner",
    patterns: [/^uruchom skaner$/, /^otworz skaner$/],
  },
  {
    id: "add-item",
    description: "Dodaj produkt",
    patterns: [/^dodaj produkt$/, /^dodaj przedmiot$/],
  },
]

export const matchVoiceCommand = (transcript: string): VoiceCommand | null => {
  const normalized = normalizeTranscript(transcript)
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      if (pattern.test(normalized)) {
        return command
      }
    }
  }
  return null
}
