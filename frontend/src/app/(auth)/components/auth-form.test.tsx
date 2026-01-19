import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import messages from "../../../../messages/en.json"
import AuthForm from "./auth-form"

// Constants for regex patterns
const getMessage = (key: string) => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown>)?.[part],
      messages
    )

  if (typeof value !== "string") {
    throw new Error(`Missing message for key: ${key}`)
  }

  return value
}
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const PASSWORD_REGEX = new RegExp(
  `^${escapeRegExp(getMessage("auth.fields.password"))}$`,
  "i"
)
const EXACT_PASSWORD_REGEX = new RegExp(
  `^${escapeRegExp(getMessage("auth.fields.password"))}$`,
  "i"
)
const CONFIRM_PASSWORD_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.fields.confirmPassword")),
  "i"
)
const EMAIL_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.fields.email")),
  "i"
)
const FULLNAME_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.fields.fullName")),
  "i"
)
const LOGIN_BUTTON_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.actions.login")),
  "i"
)
const REGISTER_BUTTON_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.actions.register")),
  "i"
)
const MISMATCH_ERROR_REGEX = new RegExp(
  escapeRegExp(getMessage("auth.validation.password.mismatch")),
  "i"
)

const renderWithIntl = (ui: ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )

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
vi.mock("@/lib/fetcher", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  }
})

// Mock helpers
const mockHandleApiError = vi.fn()
vi.mock("@/hooks/use-handle-api-error", () => ({
  useHandleApiError: () => mockHandleApiError,
}))

// Mock try-catch helper to act predictably
vi.mock("@/lib/try-catch", () => ({
  default: async (promise: Promise<unknown>) => {
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
      renderWithIntl(<AuthForm mode="login" />)

      expect(screen.getByLabelText(PASSWORD_REGEX)).toBeInTheDocument()
      expect(screen.queryByLabelText(EMAIL_REGEX)).toBeInTheDocument()
      expect(screen.queryByLabelText(FULLNAME_REGEX)).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: LOGIN_BUTTON_REGEX })
      ).toBeInTheDocument()
    })

    it("handles successful login", async () => {
      mockApiFetch.mockResolvedValue({ requiresTwoFactor: false })
      renderWithIntl(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "password123" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          "/api/auth/login",
          expect.anything(),
          expect.objectContaining({
            method: "POST",
            body: { email: "testuser@example.com", password: "password123" },
          })
        )
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard")
      })
    })

    it("handles successful login with 2FA requirement", async () => {
      mockApiFetch.mockResolvedValue({ requiresTwoFactor: true })
      renderWithIntl(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "password123" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login/2fa")
      })
    })

    it("handles login error", async () => {
      const error = new Error("Invalid credentials")
      mockApiFetch.mockRejectedValue(error)
      renderWithIntl(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_REGEX), {
        target: { value: "password123" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_REGEX }))

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          getMessage("auth.errors.loginFailed")
        )
      })
    })

    it("validates empty fields", async () => {
      renderWithIntl(<AuthForm mode="login" />)

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
      renderWithIntl(<AuthForm mode="register" />)

      expect(screen.getByLabelText(PASSWORD_REGEX)).toBeInTheDocument()
      expect(screen.getByLabelText(EMAIL_REGEX)).toBeInTheDocument()
      expect(screen.getByLabelText(FULLNAME_REGEX)).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      ).toBeInTheDocument()
    })

    it("handles successful registration", async () => {
      mockApiFetch.mockResolvedValue({})
      renderWithIntl(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getAllByLabelText(PASSWORD_REGEX)[0], {
        // Password field
        target: { value: "password123" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "password123" },
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
              password: "password123",
            },
          })
        )
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login")
      })
    })

    it("validates password mismatch", async () => {
      renderWithIntl(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })

      fireEvent.change(screen.getByLabelText(EXACT_PASSWORD_REGEX), {
        target: { value: "password123" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "password456" },
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
      renderWithIntl(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_REGEX), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_REGEX), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getByLabelText(EXACT_PASSWORD_REGEX), {
        target: { value: "password123" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
        target: { value: "password123" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_REGEX })
      )

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          getMessage("auth.errors.registerFailed")
        )
      })
    })
  })
})
