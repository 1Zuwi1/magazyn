import {
  Key01Icon,
  LicenseIcon,
  Mail01Icon,
  SecurityKeyUsbIcon,
} from "@hugeicons/core-free-icons"
import { translateMessage } from "@/i18n/translate-message"
import type { TwoFactorMethod } from "@/lib/schemas"
import type { IconComponent } from "../types"

export const getStatusConfig = () =>
  ({
    LOCKED: {
      label: translateMessage("generated.shared.blocked"),
      variant: "destructive",
    },
    PENDING_VERIFICATION: {
      label: translateMessage("generated.dashboard.settings.verified2"),
      variant: "warning",
    },
    DISABLED: {
      label: translateMessage("generated.shared.disabled"),
      variant: "destructive",
    },
    ACTIVE: {
      label: translateMessage("generated.shared.active"),
      variant: "success",
    },
  }) as const

export const getRoleLabels = () =>
  ({
    ADMIN: translateMessage("generated.dashboard.settings.administrator"),
    USER: translateMessage("generated.dashboard.shared.user"),
  }) as const

export const getTwoFactorMethods = (locale?: string) =>
  [
    {
      value: "AUTHENTICATOR",
      label: translateMessage(
        "generated.dashboard.settings.authenticator",
        undefined,
        locale
      ),
      hint: translateMessage(
        "generated.dashboard.settings.recommendedMethod",
        undefined,
        locale
      ),
      addable: true,
    },
    {
      value: "EMAIL",
      label: translateMessage(
        "generated.dashboard.settings.eMail",
        undefined,
        locale
      ),
      hint: translateMessage(
        "generated.dashboard.settings.codeSentMailbox",
        undefined,
        locale
      ),
      addable: true,
    },
    {
      value: "PASSKEYS",
      label: translateMessage(
        "generated.dashboard.settings.securityKeys",
        undefined,
        locale
      ),
      hint: translateMessage(
        "generated.dashboard.settings.passwordlessAuthenticationUsingDevicesSupport",
        undefined,
        locale
      ),
      addable: false,
    },
    {
      value: "BACKUP_CODES",
      label: translateMessage(
        "generated.dashboard.settings.recoveryCodes",
        undefined,
        locale
      ),
      hint: translateMessage(
        "generated.dashboard.settings.oneTimeCodesUseOther",
        undefined,
        locale
      ),
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
