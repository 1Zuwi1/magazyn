import {
  Key01Icon,
  LicenseIcon,
  Mail01Icon,
  SecurityKeyUsbIcon,
} from "@hugeicons/core-free-icons"
import type { AppTranslate } from "@/i18n/use-translations"
import type { TwoFactorMethod } from "@/lib/schemas"
import type { IconComponent } from "../types"

export const getStatusConfig = (t: AppTranslate) =>
  ({
    LOCKED: {
      label: t("generated.shared.blocked"),
      variant: "destructive",
    },
    PENDING_VERIFICATION: {
      label: t("generated.dashboard.settings.verified2"),
      variant: "warning",
    },
    DISABLED: {
      label: t("generated.shared.disabled"),
      variant: "destructive",
    },
    ACTIVE: {
      label: t("generated.shared.active"),
      variant: "success",
    },
  }) as const

export const getRoleLabels = (t: AppTranslate) =>
  ({
    ADMIN: t("generated.dashboard.settings.administrator"),
    USER: t("generated.dashboard.shared.user"),
  }) as const

export const getTwoFactorMethods = (t: AppTranslate) =>
  [
    {
      value: "AUTHENTICATOR",
      label: t("generated.dashboard.settings.authenticator"),
      hint: t("generated.dashboard.settings.recommendedMethod"),
      addable: true,
    },
    {
      value: "EMAIL",
      label: t("generated.dashboard.settings.eMail"),
      hint: t("generated.dashboard.settings.codeSentMailbox"),
      addable: true,
    },
    {
      value: "PASSKEYS",
      label: t("generated.dashboard.settings.securityKeys"),
      hint: t(
        "generated.dashboard.settings.passwordlessAuthenticationUsingDevicesSupport"
      ),
      addable: false,
    },
    {
      value: "BACKUP_CODES",
      label: t("generated.dashboard.settings.recoveryCodes"),
      hint: t("generated.dashboard.settings.oneTimeCodesUseOther"),
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
