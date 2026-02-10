import type { AppTranslate } from "@/i18n/use-translations"

const BASE64_TO_URL_REPLACEMENTS = [/\+/g, /\//g] as const
const BASE64_URL_TO_BASE64_REPLACEMENTS = [/-/g, /_/g] as const

const USER_VERIFICATION_VALUES = [
  "required",
  "preferred",
  "discouraged",
] as const

type SupportState = "supported" | "unsupported"

type UserVerificationValue = (typeof USER_VERIFICATION_VALUES)[number]

type Base64UrlString = string

const AUTHENTICATOR_TRANSPORTS = [
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
] as const

type AuthenticatorTransportValue = (typeof AUTHENTICATOR_TRANSPORTS)[number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isAuthenticatorTransport = (
  value: string
): value is AuthenticatorTransportValue =>
  AUTHENTICATOR_TRANSPORTS.includes(value as AuthenticatorTransportValue)

const unwrapPublicKeyOptions = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value
  }

  if ("publicKey" in value) {
    return value.publicKey
  }

  if ("options" in value) {
    return unwrapPublicKeyOptions(value.options)
  }

  return value
}

const isRequestOptionsJSON = (
  value: unknown
): value is PublicKeyCredentialRequestOptionsJSON => {
  if (!isRecord(value)) {
    return false
  }

  return "challenge" in value && typeof value.challenge === "string"
}

const normalizeUserVerification = (
  value: string | undefined
): UserVerificationRequirement | undefined => {
  if (!value) {
    return undefined
  }

  if (USER_VERIFICATION_VALUES.includes(value as UserVerificationValue)) {
    return value as UserVerificationRequirement
  }

  return undefined
}

const decodeBase64Url = (value: Base64UrlString): Uint8Array => {
  const normalized = value
    .replace(BASE64_URL_TO_BASE64_REPLACEMENTS[0], "+")
    .replace(BASE64_URL_TO_BASE64_REPLACEMENTS[1], "/")

  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)

  if (typeof atob !== "function") {
    throw new Error("Base64 decoding is not supported in this environment")
  }

  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

const encodeBase64Url = (value: ArrayBufferLike): Base64UrlString => {
  const bytes = new Uint8Array(value)
  let binary = ""
  const chunkSize = 0x80_00

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  if (typeof btoa !== "function") {
    throw new Error("Base64 encoding is not supported in this environment")
  }

  const base64 = btoa(binary)

  return base64
    .replace(BASE64_TO_URL_REPLACEMENTS[0], "-")
    .replace(BASE64_TO_URL_REPLACEMENTS[1], "_")
    .replace(/=+$/g, "")
}

const toArrayBuffer = (value: Base64UrlString): ArrayBuffer => {
  const bytes = decodeBase64Url(value)
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}

const toDescriptor = (
  descriptor: PublicKeyCredentialDescriptorJSON
): PublicKeyCredentialDescriptor => {
  const { id, transports, ...rest } = descriptor
  return {
    ...rest,
    type: "public-key",
    id: toArrayBuffer(id),
    transports: transports?.filter(isAuthenticatorTransport),
  }
}

const toRequestOptions = (
  options: PublicKeyCredentialRequestOptionsJSON
): PublicKeyCredentialRequestOptions => ({
  challenge: toArrayBuffer(options.challenge),
  timeout: options.timeout,
  rpId: options.rpId,
  allowCredentials: options.allowCredentials?.map(toDescriptor),
  userVerification: normalizeUserVerification(options.userVerification),
})

const getOptionsFromApiPayload = (payload: unknown): unknown =>
  unwrapPublicKeyOptions(payload)

const toJsonValue = (value: unknown): unknown => {
  if (value instanceof ArrayBuffer) {
    return encodeBase64Url(value)
  }

  if (ArrayBuffer.isView(value)) {
    const slice = value.buffer.slice(
      value.byteOffset,
      value.byteOffset + value.byteLength
    )
    return encodeBase64Url(slice)
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item))
  }

  if (isRecord(value)) {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      result[key] = toJsonValue(item)
    }
    return result
  }

  return value
}

export const isWebAuthnSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential !== "undefined" &&
  typeof navigator !== "undefined" &&
  typeof navigator.credentials !== "undefined"

export const getWebAuthnSupport = (): SupportState =>
  isWebAuthnSupported() ? "supported" : "unsupported"

export const parseAuthenticationOptions = (
  payload: unknown
): PublicKeyCredentialRequestOptions | null => {
  const options = getOptionsFromApiPayload(payload)

  if (!isRequestOptionsJSON(options)) {
    return null
  }

  if (
    typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function"
  ) {
    try {
      return PublicKeyCredential.parseRequestOptionsFromJSON(options)
    } catch {
      return toRequestOptions(options)
    }
  }

  return toRequestOptions(options)
}

export const serializeCredential = (
  credential: PublicKeyCredential
): string => {
  if (typeof credential.toJSON === "function") {
    return JSON.stringify(credential.toJSON())
  }

  return JSON.stringify(toJsonValue(credential))
}

export const isPublicKeyCredential = (
  credential: Credential | null
): credential is PublicKeyCredential => {
  if (!credential) {
    return false
  }

  return credential.type === "public-key" && "response" in credential
}

export const getWebAuthnErrorMessage = (
  error: unknown,
  fallback: string,
  t: AppTranslate
): string => {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return t("generated.security.webauthn.operationCanceledTimedOut")
      case "InvalidStateError":
        return t("generated.security.webauthn.securityKeyAlreadyAddedDevice")
      case "NotSupportedError":
        return t("generated.security.webauthn.deviceBrowserSupportSecurityKeys")
      case "SecurityError":
        return t("generated.security.webauthn.operationBlockedSecuritySettings")
      default:
        return fallback
    }
  }

  return fallback
}
