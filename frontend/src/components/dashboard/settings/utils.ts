import type { Locale } from "next-intl"
import {
  MOCK_AUTHENTICATOR_SECRET,
  MOCK_TWO_FACTOR_DESTINATIONS,
  NON_DIGIT_REGEX,
  OTP_LENGTH,
} from "./constants"
import type {
  PasswordChallenge,
  TwoFactorChallenge,
  TwoFactorMethod,
} from "./types"

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

export const getDestinationForMethod = (method: TwoFactorMethod): string => {
  if (method === "sms") {
    return MOCK_TWO_FACTOR_DESTINATIONS.sms
  }
  if (method === "email") {
    return MOCK_TWO_FACTOR_DESTINATIONS.email
  }
  return "Aplikacja uwierzytelniająca"
}

export const createTwoFactorChallenge = async (
  method: TwoFactorMethod,
  locale: Locale
): Promise<TwoFactorChallenge> => {
  await wait(900)
  const issuedAt = new Date().toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const destination = getDestinationForMethod(method)
  const secret = method === "authenticator" ? MOCK_AUTHENTICATOR_SECRET : "—"

  return {
    sessionId: `setup_${Date.now()}`,
    secret,
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

export const verifyOneTimeCode = async (code: string): Promise<boolean> => {
  await wait(900)
  return code.length === OTP_LENGTH
}
