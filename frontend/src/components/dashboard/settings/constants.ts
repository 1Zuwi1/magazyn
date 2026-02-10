import {
  Key01Icon,
  LicenseIcon,
  Mail01Icon,
  SecurityKeyUsbIcon,
} from "@hugeicons/core-free-icons"
import { translateMessage } from "@/i18n/translate-message"
import type { TwoFactorMethod } from "@/lib/schemas"
import type { IconComponent } from "../types"

export const STATUS_CONFIG = {
  LOCKED: {
    label: translateMessage("generated.m0996"),
    variant: "destructive",
  },
  PENDING_VERIFICATION: {
    label: translateMessage("generated.m0997"),
    variant: "warning",
  },
  DISABLED: {
    label: translateMessage("generated.m0317"),
    variant: "destructive",
  },
  ACTIVE: { label: translateMessage("generated.m0891"), variant: "success" },
} as const

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  USER: translateMessage("generated.m0481"),
} as const

export const TWO_FACTOR_METHODS = [
  {
    value: "AUTHENTICATOR",
    label: translateMessage("generated.m0510"),
    hint: "Rekomendowana metoda dla kont firmowych.",
    addable: true,
  },
  {
    value: "EMAIL",
    label: translateMessage("generated.m0998"),
    hint: translateMessage("generated.m0511"),
    addable: true,
  },
  {
    value: "PASSKEYS",
    label: translateMessage("generated.m0512"),
    hint: translateMessage("generated.m0513"),
    addable: false,
  },
  {
    value: "BACKUP_CODES",
    label: translateMessage("generated.m0514"),
    hint: translateMessage("generated.m0515"),
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
