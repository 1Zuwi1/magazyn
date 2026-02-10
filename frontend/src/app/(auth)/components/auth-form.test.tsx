import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { translateMessage } from "@/i18n/translate-message"
import AuthForm from "./auth-form"

const PASSWORD_LABEL = translateMessage("generated.m0011")
const CONFIRM_PASSWORD_LABEL = translateMessage("generated.m0013")
const EMAIL_LABEL = translateMessage("generated.m0874")
const FULLNAME_LABEL = translateMessage("generated.m0007")
const LOGIN_BUTTON_LABEL = translateMessage("generated.m0014")
const REGISTER_BUTTON_LABEL = translateMessage("generated.m0015")
const PHONE_LABEL = translateMessage("generated.m0009")
const MISMATCH_ERROR_TEXT = translateMessage("generated.m0853")
const LOGIN_ERROR_TEXT = translateMessage("generated.m0001")
const REGISTER_ERROR_TEXT = translateMessage("generated.m0003")

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

      expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInTheDocument()
      expect(screen.queryByLabelText(EMAIL_LABEL)).toBeInTheDocument()
      expect(screen.queryByLabelText(FULLNAME_LABEL)).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: LOGIN_BUTTON_LABEL })
      ).toBeInTheDocument()
    })

    it("handles successful login", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_LABEL }))

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

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_LABEL }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login/2fa")
      })
    })

    it("handles login error", async () => {
      const error = new Error("Invalid credentials")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="login" />)

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_LABEL }))

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.stringContaining(LOGIN_ERROR_TEXT)
        )
      })
    })

    it("validates empty fields", async () => {
      render(<AuthForm mode="login" />)

      fireEvent.click(screen.getByRole("button", { name: LOGIN_BUTTON_LABEL }))

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

      expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInTheDocument()
      expect(screen.getByLabelText(EMAIL_LABEL)).toBeInTheDocument()
      expect(screen.getByLabelText(FULLNAME_LABEL)).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: REGISTER_BUTTON_LABEL })
      ).toBeInTheDocument()
    })

    it("handles successful registration", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_LABEL), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getByLabelText(PHONE_LABEL), {
        target: { value: "+48123456789" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: REGISTER_BUTTON_LABEL,
        })
        expect(submitButton).not.toBeDisabled()
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_LABEL })
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
              phoneNumber: "+48123456789",
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

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_LABEL), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getByLabelText(PHONE_LABEL), {
        target: { value: "+48123456789" },
      })

      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_LABEL), {
        target: { value: "Password456!" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_LABEL })
      )

      await waitFor(() => {
        expect(screen.getByText(MISMATCH_ERROR_TEXT)).toBeInTheDocument()
      })

      expect(mockApiFetch).not.toHaveBeenCalled()
    })

    it("handles registration error", async () => {
      const error = new Error("Registration failed")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="register" />)

      fireEvent.change(screen.getByLabelText(EMAIL_LABEL), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(screen.getByLabelText(FULLNAME_LABEL), {
        target: { value: "Test User" },
      })
      fireEvent.change(screen.getByLabelText(PHONE_LABEL), {
        target: { value: "+48123456789" },
      })
      fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })
      fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_LABEL), {
        target: { value: "Password123!" },
      })

      fireEvent.click(
        screen.getByRole("button", { name: REGISTER_BUTTON_LABEL })
      )

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.stringContaining(REGISTER_ERROR_TEXT)
        )
      })
    })
  })
})
