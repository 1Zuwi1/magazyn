import { render, screen } from "@testing-library/react"
import { redirect } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getSession } from "@/lib/session"
import ProtectedPage from "./protected-page"

// Mock server-only to avoid errors in test environment
vi.mock("server-only", () => {
  return {}
})

// Mock getSession
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}))

// Mock redirect to make it testable
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

// Mock UnauthorizedComponent to simplify assertions
vi.mock("./components/unauthorized", () => ({
  default: () => <div data-testid="unauthorized">Unauthorized Access</div>,
}))

describe("ProtectedPage", () => {
  const mockGetSession = getSession as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing when session is null", async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await ProtectedPage({
      children: <div>Protected Content</div>,
    })

    expect(result).toBeNull()
    expect(mockGetSession).toHaveBeenCalledWith("/login")
  })

  it("renders children when session exists and no admin privileges required", async () => {
    const mockSession = { user: { id: 1 }, role: "user" }
    mockGetSession.mockResolvedValue(mockSession)

    const jsx = await ProtectedPage({
      children: <div>Protected Content</div>,
    })

    render(jsx)

    expect(screen.getByText("Protected Content")).toBeInTheDocument()
    expect(screen.queryByTestId("unauthorized")).not.toBeInTheDocument()
  })

  it("renders children when session exists (admin) and admin privileges required", async () => {
    const mockSession = { user: { id: 1 }, role: "admin" }
    mockGetSession.mockResolvedValue(mockSession)

    const jsx = await ProtectedPage({
      children: <div>Admin Content</div>,
      needAdminPrivileges: true,
    })

    render(jsx)

    expect(screen.getByText("Admin Content")).toBeInTheDocument()
    expect(screen.queryByTestId("unauthorized")).not.toBeInTheDocument()
  })

  it("renders UnauthorizedComponent when user is not admin but admin privileges required", async () => {
    const mockSession = { user: { id: 1 }, role: "user" }
    mockGetSession.mockResolvedValue(mockSession)

    const jsx = await ProtectedPage({
      children: <div>Admin Content</div>,
      needAdminPrivileges: true,
    })

    render(jsx)

    expect(screen.getByTestId("unauthorized")).toBeInTheDocument()
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
  })

  it("calls children as function with session", async () => {
    const mockSession = { user: { id: 1 }, role: "user" }
    mockGetSession.mockResolvedValue(mockSession)

    const childrenFn = vi.fn().mockReturnValue(<div>Function Content</div>)

    const jsx = await ProtectedPage({
      children: childrenFn,
    })

    render(jsx)

    expect(childrenFn).toHaveBeenCalledWith(mockSession)
    expect(screen.getByText("Function Content")).toBeInTheDocument()
  })

  it("passes custom redirectTo to getSession", async () => {
    mockGetSession.mockResolvedValue(null)

    await ProtectedPage({
      children: <div>Content</div>,
      redirectTo: "/custom-login",
    })

    expect(mockGetSession).toHaveBeenCalledWith("/custom-login")
  })

  it("redirects unverified users to pending verification", async () => {
    const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })

    const mockSession = { user: { id: 1 }, role: "user", status: "unverified" }
    mockGetSession.mockResolvedValue(mockSession)

    await expect(
      ProtectedPage({
        children: <div>Protected Content</div>,
      })
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(mockRedirect).toHaveBeenCalledWith("/pending-verification")
  })
})
