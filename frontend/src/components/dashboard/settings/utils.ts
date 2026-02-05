import type { Locale } from "next-intl"
import { OTP_LENGTH } from "@/config/constants"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  Check2FASchema,
  Resend2FASchema,
  type ResendType,
  TFAAuthenticatorStartSchema,
  type TwoFactorMethod,
} from "@/lib/schemas"
import { MOCK_TWO_FACTOR_DESTINATIONS, NON_DIGIT_REGEX } from "./constants"
import type { PasswordChallenge, TwoFactorChallenge } from "./types"

export const wait = async (durationMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

export const sanitizeOtpValue = (value: string): string =>
  value.replace(NON_DIGIT_REGEX, "").slice(0, OTP_LENGTH)

export const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@")
  if (!(local && domain)) {
    return email
  }
  const visible = local.trim().slice(0, 1)
  return `${visible}***@${domain}`
}

export const getDestinationForMethod = (
  method: TwoFactorMethod,
  userEmail?: string
): string => {
  if (method === "EMAIL") {
    return userEmail ? maskEmail(userEmail) : MOCK_TWO_FACTOR_DESTINATIONS.email
  }
  if (method === "PASSKEYS") {
    return "Klucze bezpieczeństwa"
  }
  return "Aplikacja uwierzytelniająca"
}

export const createTwoFactorChallenge = async (
  method: TwoFactorMethod,
  locale: Locale,
  userEmail?: string
): Promise<TwoFactorChallenge> => {
  const issuedAt = new Date().toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const destination = getDestinationForMethod(method, userEmail)
  const sessionId = `setup_${Date.now()}`

  if (method === "AUTHENTICATOR") {
    const response = await apiFetch(
      "/api/2fa/authenticator/start",
      TFAAuthenticatorStartSchema,
      {
        method: "POST",
        body: null,
      }
    )

    return {
      sessionId,
      secret: response.secretKey,
      destination: maskEmail(response.email),
      issuedAt,
      accountName: response.email,
      issuer: response.issuer,
    }
  }

  return {
    sessionId,
    secret: "—",
    destination,
    issuedAt,
  }
}

export const createPasswordChallenge = async (
  method: TwoFactorMethod
): Promise<PasswordChallenge> => {
  await wait(700)
  const destination = getDestinationForMethod(method)

  return {
    sessionId: `pwd_${Date.now()}`,
    destination,
  }
}

export const sendVerificationCode = async (
  sessionId: string
): Promise<void> => {
  const jitter = Math.min(sessionId.length * 8, 240)
  await wait(1100 + jitter)
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
    await apiFetch("/api/2fa/check", Check2FASchema, {
      method: "POST",
      body: { code, method },
    })
    return true
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      return false
    }
    throw error
  }
}
