import type { Locale } from "next-intl"
import { OTP_LENGTH } from "@/config/constants"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  Check2FASchema,
  Resend2FASchema,
  type ResendType,
  TFAAuthenticatorFinishSchema,
  TFAAuthenticatorStartSchema,
  type TwoFactorMethod,
} from "@/lib/schemas"
import { NON_DIGIT_REGEX } from "./constants"
import type { AuthenticatorSetupData } from "./types"

export const sanitizeOtpValue = (value: string): string =>
  value.replace(NON_DIGIT_REGEX, "").slice(0, OTP_LENGTH)

export const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export const createAuthenticatorSetupData = async (
  locale: Locale
): Promise<AuthenticatorSetupData> => {
  const issuedAt = new Date().toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const response = await apiFetch(
    "/api/2fa/authenticator/start",
    TFAAuthenticatorStartSchema,
    {
      method: "POST",
      body: null,
    }
  )

  return {
    secret: response.secretKey,
    accountName: response.email,
    issuer: response.issuer,
    issuedAt,
  }
}

export const sendTwoFactorCode = async (method: ResendType): Promise<void> => {
  await apiFetch("/api/2fa/send", Resend2FASchema, {
    method: "POST",
    body: { method },
  })
}

export const verifyOneTimeCode = async (
  code: string,
  method: TwoFactorMethod
): Promise<boolean> => {
  try {
    if (method === "AUTHENTICATOR") {
      await apiFetch(
        "/api/2fa/authenticator/finish",
        TFAAuthenticatorFinishSchema,
        {
          method: "POST",
          body: { code },
        }
      )
    } else {
      await apiFetch("/api/2fa/check", Check2FASchema, {
        method: "POST",
        body: { code, method },
      })
    }
    return true
  } catch (error) {
    if (FetchError.isError(error) && error.status === 401) {
      return false
    }
    throw error
  }
}
