import {
  Key01Icon,
  LicenseIcon,
  Mail01Icon,
  SecurityKeyUsbIcon,
} from "@hugeicons/core-free-icons"
import type { TwoFactorMethod } from "@/lib/schemas"
import type { IconComponent } from "../types"

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
    addable: true,
  },
  {
    value: "EMAIL",
    label: "E-mail",
    hint: "Kod wysyłany na skrzynkę pocztową.",
    addable: true,
  },
  {
    value: "PASSKEYS",
    label: "Klucze bezpieczeństwa",
    hint: "Uwierzytelnianie bezhasłowe przy użyciu urządzeń z obsługą kluczy bezpieczeństwa.",
    addable: false,
  },
  {
    value: "BACKUP_CODES",
    label: "Kody odzyskiwania",
    hint: "Jednorazowe kody do wykorzystania, gdy inne metody są niedostępne.",
    addable: false,
  },
] as const

export const METHOD_ICONS: Record<TwoFactorMethod, IconComponent> = {
  AUTHENTICATOR: Key01Icon,
  EMAIL: Mail01Icon,
  PASSKEYS: SecurityKeyUsbIcon,
  BACKUP_CODES: LicenseIcon,
}

export const RESEND_COOLDOWN_SECONDS = 30
export const TWO_FACTOR_RESEND_SECONDS = 60
export const QR_CODE_DEFAULT_SIZE = 160
export const AUTHENTICATOR_QR_SIZE = 140
export const COPY_FEEDBACK_TIMEOUT_MS = 2000
export const NON_DIGIT_REGEX = /\D/g
