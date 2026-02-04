import {
  Key01Icon,
  Mail01Icon,
  SecurityKeyUsbIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import type { TwoFactorMethod } from "@/lib/schemas"

export const STATUS_CONFIG = {
  LOCKED: { label: "Zablokowane", variant: "destructive" },
  PENDING_VERIFICATION: { label: "Niezweryfikowane", variant: "warning" },
  DISABLED: { label: "Wyłączone", variant: "destructive" },
  ACTIVE: { label: "Aktywne", variant: "success" },
} as const

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  USER: "Użytkownik",
} as const

export const TWO_FACTOR_METHODS = [
  {
    value: "AUTHENTICATOR",
    label: "Aplikacja uwierzytelniająca",
    hint: "Rekomendowana metoda dla kont firmowych.",
  },
  {
    value: "SMS",
    label: "SMS",
    hint: "Kod wysyłany na numer telefonu.",
  },
  {
    value: "EMAIL",
    label: "E-mail",
    hint: "Kod wysyłany na skrzynkę pocztową.",
  },
  {
    value: "PASSKEYS",
    label: "Klucze bezpieczeństwa",
    hint: "Uwierzytelnianie bezhasłowe przy użyciu urządzeń z obsługą kluczy bezpieczeństwa.",
  },
] as const

export const METHOD_ICONS: Record<TwoFactorMethod, typeof Key01Icon> = {
  AUTHENTICATOR: Key01Icon,
  SMS: SmartPhone01Icon,
  EMAIL: Mail01Icon,
  PASSKEYS: SecurityKeyUsbIcon,
}

export const MOCK_PROFILE_FORM = {
  phone: "+48 555 019 203",
  company: "MagazynPro Sp. z o.o.",
  location: "Gdańsk, Polska",
  team: "Operacje magazynowe",
} as const

export const RECOVERY_CODES = [
  "7DFK-93NX",
  "3H2P-YZ8V",
  "K9LQ-5VTX",
  "6QRP-1CZ4",
  "T8WM-2HNK",
  "M0QJ-8D3R",
  "NL7C-44PD",
  "2VXR-G1U6",
  "X6ZP-9S2L",
  "R3JD-5FQ8",
] as const

export const RESEND_COOLDOWN_SECONDS = 30
export const TWO_FACTOR_RESEND_SECONDS = 60
export const QR_CODE_DEFAULT_SIZE = 160
export const AUTHENTICATOR_QR_SIZE = 140
export const COPY_FEEDBACK_TIMEOUT_MS = 2000
export const NON_DIGIT_REGEX = /\D/g
export const MOCK_AUTHENTICATOR_SECRET = "H8X2 Q9LP 4T7Z 1V6K"
export const MOCK_TWO_FACTOR_DESTINATIONS = {
  sms: "+48 *** *** 203",
  email: "a***@magazynpro.pl",
} as const
