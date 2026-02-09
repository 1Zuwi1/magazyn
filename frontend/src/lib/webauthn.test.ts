import { describe, expect, it } from "vitest"
import {
  getWebAuthnErrorMessage,
  getWebAuthnSupport,
  isPublicKeyCredential,
  parseAuthenticationOptions,
  serializeCredential,
} from "./webauthn"

const setupWebAuthnGlobals = () => {
  if (typeof window === "undefined") {
    global.window = {} as any
  }
  if (typeof navigator === "undefined") {
    global.navigator = {} as any
  }
  if (!("PublicKeyCredential" in window)) {
    Object.defineProperty(window, "PublicKeyCredential", {
      value: class PublicKeyCredential {},
      configurable: true,
    })
  }
  if (!("credentials" in navigator)) {
    Object.defineProperty(navigator, "credentials", {
      value: {},
      configurable: true,
    })
  }
}

setupWebAuthnGlobals()

const encodeBase64Url = (value: string): string => {
  if (typeof btoa !== "function") {
    throw new Error("btoa is not available in this environment")
  }
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const decodeBuffer = (buffer: ArrayBuffer): string =>
  new TextDecoder().decode(new Uint8Array(buffer))

describe("parseAuthenticationOptions", () => {
  it("parses request options and maps user verification", () => {
    const challenge = encodeBase64Url("auth")
    const credentialId = encodeBase64Url("cred-id")

    const payload = {
      publicKey: {
        challenge,
        rpId: "example.com",
        allowCredentials: [{ id: credentialId, type: "public-key" }],
        userVerification: "preferred",
      } satisfies PublicKeyCredentialRequestOptionsJSON,
    }

    const options = parseAuthenticationOptions(payload)
    expect(options).not.toBeNull()
    if (!options) {
      return
    }

    expect(decodeBuffer(options.challenge as ArrayBuffer)).toBe("auth")
    expect(options.userVerification).toBe("preferred")
    expect(options.allowCredentials?.[0]?.id).toBeInstanceOf(ArrayBuffer)
  })
})

describe("serializeCredential", () => {
  it("serializes using toJSON when available", () => {
    const credential = {
      toJSON: () => ({ id: "credential-id" }),
    } as unknown as PublicKeyCredential

    expect(serializeCredential(credential)).toBe(
      JSON.stringify({ id: "credential-id" })
    )
  })
})

describe("isPublicKeyCredential", () => {
  it("detects public key credentials", () => {
    const credential = {
      id: "credential-id",
      type: "public-key",
      response: {},
    } as unknown as Credential

    expect(isPublicKeyCredential(credential)).toBe(true)
    expect(isPublicKeyCredential(null)).toBe(false)
  })
})

describe("getWebAuthnSupport", () => {
  it("reports supported when WebAuthn globals are available", () => {
    const hasPublicKey = "PublicKeyCredential" in window
    const hasCredentials = "credentials" in navigator

    if (!hasPublicKey) {
      Object.defineProperty(window, "PublicKeyCredential", {
        value: class PublicKeyCredential {},
        configurable: true,
      })
    }
    if (!hasCredentials) {
      Object.defineProperty(navigator, "credentials", {
        value: {},
        configurable: true,
      })
    }

    expect(getWebAuthnSupport()).toBe("supported")
  })
})

describe("getWebAuthnErrorMessage", () => {
  it("maps DOMException names to user-friendly messages", () => {
    const error = new DOMException("", "NotAllowedError")

    expect(getWebAuthnErrorMessage(error, "fallback")).toBe(
      "Operacja została anulowana lub przekroczono limit czasu."
    )
  })

  it("returns fallback for non-DOMException", () => {
    expect(getWebAuthnErrorMessage(new Error("boom"), "fallback")).toBe(
      "fallback"
    )
  })
})
