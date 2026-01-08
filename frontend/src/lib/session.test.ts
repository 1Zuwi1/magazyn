import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockApiFetch = vi.hoisted(() => vi.fn())
const mockHeaders = vi.hoisted(() => vi.fn())
const mockRedirect = vi.hoisted(() => vi.fn())

vi.mock("./fetcher", () => ({
  apiFetch: mockApiFetch,
}))

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}))

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}))

interface SessionUser {
  id: number
  email: string
  username: string
  full_name: string | null
  two_factor_enabled: boolean
  role: "user" | "admin"
}

const buildUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: 1,
  email: "user@example.com",
  username: "testuser",
  full_name: "Test User",
  two_factor_enabled: true,
  role: "user",
  ...overrides,
})

describe("getSession", () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockHeaders.mockReset()
    mockRedirect.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns user data when session is valid", async () => {
    const userData = buildUser()
    mockApiFetch.mockResolvedValueOnce(userData)

    const { getSession } = await import("./session")
    const { ApiMeSchema } = await import("./schemas")

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    const [path, schema, init] = mockApiFetch.mock.calls[0] ?? []
    expect(path).toBe("/api/auth/me")
    expect(schema).toBe(ApiMeSchema)
    expect(init).toEqual(expect.objectContaining({ method: "GET" }))
    expect(mockHeaders).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("returns user data with nullable full_name", async () => {
    const userData = buildUser({ full_name: null })
    mockApiFetch.mockResolvedValueOnce(userData)

    const { getSession } = await import("./session")

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(result?.full_name).toBeNull()
  })

  it("returns null when apiFetch rejects", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"))

    const { getSession } = await import("./session")

    const result = await getSession()

    expect(result).toBeNull()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("redirects when redirectTo is provided and apiFetch rejects", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"))

    const { getSession } = await import("./session")

    const result = await getSession("/login")

    expect(result).toBeNull()
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("adds headers when running on the server", async () => {
    vi.stubGlobal("window", undefined)

    const serverHeaders = new Headers({ "x-test": "1" })
    mockHeaders.mockResolvedValueOnce(serverHeaders)
    mockApiFetch.mockResolvedValueOnce(buildUser())

    const { getSession } = await import("./session")
    const { ApiMeSchema } = await import("./schemas")

    await getSession()

    expect(mockHeaders).toHaveBeenCalledTimes(1)
    const [path, schema, init] = mockApiFetch.mock.calls[0] ?? []
    expect(path).toBe("/api/auth/me")
    expect(schema).toBe(ApiMeSchema)
    expect(init).toEqual(
      expect.objectContaining({ method: "GET", headers: serverHeaders })
    )
  })
})
