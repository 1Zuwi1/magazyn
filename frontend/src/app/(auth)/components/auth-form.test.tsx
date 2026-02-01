import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AuthForm from "./auth-form"

// Constants for regex patterns
const PASSWORD_REGEX = /^hasło$/i
const EXACT_PASSWORD_REGEX = /^hasło$/i
const CONFIRM_PASSWORD_REGEX = /potwierdź hasło/i
const EMAIL_REGEX = /email/i
const FULLNAME_REGEX = /pełne imię i nazwisko/i
const LOGIN_BUTTON_REGEX = /zaloguj się/i
const REGISTER_BUTTON_REGEX = /zarejestruj się/i
const MISMATCH_ERROR_REGEX = /hasła nie są zgodne/i

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock API fetcher
const mockApiFetch = vi.fn()
vi.mock("@/lib/fetcher", () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}))

// Mock helpers
const mockHandleApiError = vi.fn()
vi.mock("@/components/dashboard/utils/helpers", () => ({
  handleApiError: (...args: any[]) => mockHandleApiError(...args),
}))

// Mock try-catch helper to act predictably
vi.mock("@/lib/try-catch", () => ({
  default: async (promise: Promise<any>) => {
    try {
      const data = await promise
      return [null, data]
    } catch (error) {
      return [error, null]
    }
  },
}))

describe("AuthForm", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockApiFetch.mockResolvedValue({})
  })

  describe("Login Mode", () => {
    it("renders login fields correctly", () => {
      render(<AuthForm mode="login" />)

      expect(screen.getByLabelText(PASSWORD_REGEX)).toBeInTheDocument()
      expect(screen.queryByLabelText(EMAIL_REGEX)).toBeInTheDocument()
      expect(screen.queryByLabelText(FULLNAME_REGEX)).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: LOGIN_BUTTON_REGEX })
      ).toBeInTheDocument()
    })

    it("handles successful login", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          "/api/auth/login",
          expect.anything(),
          expect.objectContaining({
            method: "POST",
            body: {
              email: "testuser@example.com",
              password: "Password123!",
              rememberMe: false,
            },
          })
        )
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login/2fa")
      })
    })

    it("handles successful login with 2FA requirement", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login/2fa")
      })
    })

    it("handles login error", async () => {
      const error = new Error("Invalid credentials")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.stringContaining("Wystąpił błąd")
        )
      })
    })

    it("validates empty fields", async () => {
      render(<AuthForm mode="login" />)

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        const errors = screen.getAllByRole("paragraph")
        expect(errors.length).toBeGreaterThan(0)
      })

      expect(mockApiFetch).not.toHaveBeenCalled()
    })
  })

  describe("Register Mode", () => {
    it("renders register fields correctly", () => {
      render(<AuthForm mode="register" />)

      expect(screen.getByLabelText(PASSWORD_REGEX)).toBeInTheDocument()
      expect(screen.getByLabelText(EMAIL_REGEX)).toBeInTheDocument()
      expect(screen.getByLabelText(FULLNAME_REGEX)).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      ).toBeInTheDocument()
    })

    it("handles successful registration", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getAllByLabelText(PASSWORD_REGEX)[0], {
        // Password field
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      )

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          "/api/auth/register",
          expect.anything(),
          expect.objectContaining({
            method: "POST",
            body: {
              email: "test@example.com",
              fullName: "Test User",
              password: "Password123!",
            },
          })
        )
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login")
      })
    })

    it("validates password mismatch", async () => {
      render(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })

      fireEvent.change(screen.getByLabelText(EXACT_PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "Password456!" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      )

      await waitFor(() => {
        expect(screen.getByText(MISMATCH_ERROR_REGEX)).toBeInTheDocument()
      })

      expect(mockApiFetch).not.toHaveBeenCalled()
    })

    it("handles registration error", async () => {
      const error = new Error("Registration failed")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getByLabelText(EXACT_PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "Password123!" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      )

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.stringContaining("Wystąpił błąd")
        )
      })
    })
  })
})
