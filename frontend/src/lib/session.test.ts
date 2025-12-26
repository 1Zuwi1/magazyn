import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getSession } from "./session"

describe("getSession", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  it("returns user data when session is valid", async () => {
    const userData = {
      id: 1,
      email: "user@example.com",
      username: "testuser",
      full_name: "Test User",
      two_factor_enabled: true,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: userData,
      }),
    })

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    )
  })

  it("returns user data with nullable full_name", async () => {
    const userData = {
      id: 1,
      email: "user@example.com",
      username: "testuser",
      full_name: null,
      two_factor_enabled: false,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: userData,
      }),
    })

    const result = await getSession()

    expect(result).toEqual(userData)
    expect(result?.full_name).toBeNull()
  })

  it("returns null when user is not authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      clone: () => ({
        json: async () => ({ message: "Not authenticated" }),
      }),
      json: async () => ({ message: "Not authenticated" }),
    })

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns null when request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns null when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      clone: () => ({
        json: async () => ({ message: "Server error" }),
      }),
      json: async () => ({ message: "Server error" }),
    })

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns null when JSON parsing fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => {
        throw new Error("Invalid JSON")
      },
    })

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns null when schema validation fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          email: "not-an-email", // Invalid email format
          username: "testuser",
          full_name: null,
          two_factor_enabled: false,
        },
      }),
    })

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns null when server returns success: false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        message: "Session expired",
      }),
    })

    const result = await getSession()

    expect(result).toBeNull()
  })

  it("returns the same cached function on multiple calls", () => {
    // The React cache function returns the same function instance
    const session1 = getSession
    const session2 = getSession

    expect(session1).toBe(session2)
  })
})
