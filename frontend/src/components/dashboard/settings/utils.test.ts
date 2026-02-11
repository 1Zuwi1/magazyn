import { beforeEach, describe, expect, it, vi } from "vitest"
import { FetchError } from "@/lib/fetcher"
import { verifyOneTimeCode } from "./utils"

const {
  apiFetchMock,
  check2FASchemaMock,
  resend2FASchemaMock,
  tfaAuthenticatorFinishSchemaMock,
  tfaAuthenticatorStartSchemaMock,
} = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  check2FASchemaMock: { name: "Check2FASchema" },
  resend2FASchemaMock: { name: "Resend2FASchema" },
  tfaAuthenticatorFinishSchemaMock: { name: "TFAAuthenticatorFinishSchema" },
  tfaAuthenticatorStartSchemaMock: { name: "TFAAuthenticatorStartSchema" },
}))

vi.mock("@/lib/schemas", () => ({
  Check2FASchema: check2FASchemaMock,
  Resend2FASchema: resend2FASchemaMock,
  TFAAuthenticatorFinishSchema: tfaAuthenticatorFinishSchemaMock,
  TFAAuthenticatorStartSchema: tfaAuthenticatorStartSchemaMock,
}))

vi.mock("@/lib/fetcher", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/fetcher")>("@/lib/fetcher")

  return {
    ...actual,
    apiFetch: apiFetchMock,
  }
})

describe("verifyOneTimeCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls authenticator finish endpoint for authenticator method", async () => {
    apiFetchMock.mockResolvedValue({
      secretKey: "SECRETKEY",
      email: "test@example.com",
      issuer: "MagazynPro",
    })

    const result = await verifyOneTimeCode("123456", "AUTHENTICATOR")

    expect(result).toBe(true)
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/2fa/authenticator/finish",
      tfaAuthenticatorFinishSchemaMock,
      {
        method: "POST",
        body: { code: "123456" },
      }
    )
  })

  it("calls generic check endpoint for non-authenticator methods", async () => {
    apiFetchMock.mockResolvedValue(null)

    const method = "EMAIL"
    const result = await verifyOneTimeCode("654321", method)

    expect(result).toBe(true)
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/2fa/check",
      check2FASchemaMock,
      {
        method: "POST",
        body: { code: "654321", method },
      }
    )
  })

  it("returns false for unauthorized responses", async () => {
    apiFetchMock.mockRejectedValue(new FetchError("Unauthorized", 401))

    const result = await verifyOneTimeCode("123456", "AUTHENTICATOR")

    expect(result).toBe(false)
  })

  it("rethrows non-unauthorized errors", async () => {
    const error = new FetchError("UNEXPECTED_ERROR", 500)
    apiFetchMock.mockRejectedValue(error)

    await expect(verifyOneTimeCode("123456", "AUTHENTICATOR")).rejects.toBe(
      error
    )
  })
})
