import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AuthForm from "./auth-form"

vi.mock("@/i18n/use-translations", () => ({
  useAppTranslations: () => (key: string) => key,
}))

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
  const getInput = (name: string): HTMLInputElement => {
    const input = document.querySelector(`input[name="${name}"]`)
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Input not found: ${name}`)
    }
    return input
  }

  const getSubmitButton = (): HTMLButtonElement => {
    const button = document.querySelector('button[type="submit"]')
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Submit button not found")
    }
    return button
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockApiFetch.mockResolvedValue({})
  })

  describe("Login Mode", () => {
    it("renders login fields correctly", () => {
      render(<AuthForm mode="login" />)

      expect(getInput("password")).toBeInTheDocument()
      expect(getInput("email")).toBeInTheDocument()
      expect(document.querySelector('input[name="fullName"]')).toBeNull()
      expect(getSubmitButton()).toBeInTheDocument()
    })

    it("handles successful login", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="login" />)

      fireEvent.change(getInput("email"), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })

      fireEvent.click(getSubmitButton())

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

      fireEvent.change(getInput("email"), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })

      fireEvent.click(getSubmitButton())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login/2fa")
      })
    })

    it("handles login error", async () => {
      const error = new Error("Invalid credentials")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="login" />)

      fireEvent.change(getInput("email"), {
        target: { value: "testuser@example.com" },
      })
      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })

      fireEvent.click(getSubmitButton())

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.any(String),
          expect.any(Function)
        )
      })
    })

    it("validates empty fields", async () => {
      render(<AuthForm mode="login" />)

      fireEvent.click(getSubmitButton())

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

      expect(getInput("password")).toBeInTheDocument()
      expect(getInput("email")).toBeInTheDocument()
      expect(getInput("fullName")).toBeInTheDocument()
      expect(getSubmitButton()).toBeInTheDocument()
    })

    it("handles successful registration", async () => {
      mockApiFetch.mockResolvedValue({})
      render(<AuthForm mode="register" />)

      fireEvent.change(getInput("email"), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(getInput("fullName"), {
        target: { value: "Test User" },
      })
      fireEvent.change(getInput("phoneNumber"), {
        target: { value: "+48123456789" },
      })
      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })
      fireEvent.change(getInput("confirmPassword"), {
        target: { value: "Password123!" },
      })

      await waitFor(() => {
        const submitButton = getSubmitButton()
        expect(submitButton).not.toBeDisabled()
      })

      fireEvent.click(getSubmitButton())

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

      fireEvent.change(getInput("email"), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(getInput("fullName"), {
        target: { value: "Test User" },
      })
      fireEvent.change(getInput("phoneNumber"), {
        target: { value: "+48123456789" },
      })

      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })
      fireEvent.change(getInput("confirmPassword"), {
        target: { value: "Password456!" },
      })

      fireEvent.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
      })

      expect(mockApiFetch).not.toHaveBeenCalled()
    })

    it("handles registration error", async () => {
      const error = new Error("Registration failed")
      mockApiFetch.mockRejectedValue(error)
      render(<AuthForm mode="register" />)

      fireEvent.change(getInput("email"), {
        target: { value: "test@example.com" },
      })
      fireEvent.change(getInput("fullName"), {
        target: { value: "Test User" },
      })
      fireEvent.change(getInput("phoneNumber"), {
        target: { value: "+48123456789" },
      })
      fireEvent.change(getInput("password"), {
        target: { value: "Password123!" },
      })
      fireEvent.change(getInput("confirmPassword"), {
        target: { value: "Password123!" },
      })

      fireEvent.click(getSubmitButton())

      await waitFor(() => {
        expect(mockHandleApiError).toHaveBeenCalledWith(
          error,
          expect.any(String),
          expect.any(Function)
        )
      })
    })
  })
})
