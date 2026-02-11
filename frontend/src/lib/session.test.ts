import { beforeEach, describe, expect, it, vi } from "vitest"

const mockApiFetch = vi.fn()
const mockRedirect = vi.fn()
const mockHeaders = vi.fn()

vi.mock("./fetcher", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  FetchError: class FetchError extends Error {
    status?: number
    constructor(message: string, status?: number) {
      super(message)
      this.name = "FetchError"
      this.status = status
    }

    static isError(err: unknown): err is FetchError {
      return err instanceof FetchError
    }
  },
}))

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}))

interface SessionUser {
  id: number
  email: string
  full_name: string | null
  account_status: "VERIFIED" | "UNVERIFIED" | "BANNED"
  role: "USER" | "ADMIN"
}

const buildUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: 1,
  email: "user@example.com",
  full_name: "Test User",
  role: "USER",
  account_status: "VERIFIED",
  ...overrides,
})

// Import getSession after mocks are set up
import { getSession } from "./session"

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiFetch.mockReset()
    mockRedirect.mockReset()
    mockHeaders.mockReset()
  })

  it("returns user data when session is valid", async () => {
    const userData = buildUser()
    mockApiFetch.mockResolvedValueOnce(userData)

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/users/me",
      expect.any(Object),
      {
        method: "GET",
      }
    )
  })

  it("returns user data with nullable full_name", async () => {
    const userData = buildUser({ full_name: null })
    mockApiFetch.mockResolvedValueOnce(userData)

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(result?.full_name).toBeNull()
  })

  it("returns null when apiFetch rejects", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"))

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("redirects when redirectTo is provided and apiFetch rejects", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"))

    const result = await getSession("/login")

    expect(result).toBeNull()
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("adds headers when running on the server", async () => {
    const userData = buildUser()
    mockApiFetch.mockResolvedValueOnce(userData)

    const headersValue = new Headers({ "x-test": "value" })
    mockHeaders.mockReturnValue(headersValue)

    // Mock window as undefined to simulate server environment
    const originalWindow = global.window
    // @ts-expect-error - mocking window as undefined for server test
    global.window = undefined

    await getSession()

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/users/me",
      expect.any(Object),
      expect.objectContaining({
        method: "GET",
        headers: headersValue,
      })
    )

    // Restore window
    global.window = originalWindow
  })
})
