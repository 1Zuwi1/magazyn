import { fireEvent, render, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, it, vi } from "vitest"
import { ChangePasswordSchema } from "@/lib/schemas"
import { PasswordSection } from "./password-section"

vi.mock("@/i18n/use-translations", () => ({
  useTranslations: () => (key: string) => key,
}))

const { apiFetchMock, openVerificationDialogMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  openVerificationDialogMock: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/fetcher", () => ({
  apiFetch: apiFetchMock,
}))

vi.mock(
  "@/components/dashboard/settings/two-factor-verification-dialog-store",
  () => ({
    useTwoFactorVerificationDialog: () => ({
      open: openVerificationDialogMock,
    }),
  })
)

describe("PasswordSection", () => {
  const getElement = (selector: string): Element => {
    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`Element not found for selector: ${selector}`)
    }
    return element
  }

  it("calls password change API after successful 2FA verification", async () => {
    apiFetchMock.mockResolvedValue(null)
    openVerificationDialogMock.mockImplementation(
      (options?: { onVerified?: () => void }) => {
        setTimeout(() => {
          options?.onVerified?.()
        }, 0)
      }
    )

    render(<PasswordSection />)

    fireEvent.change(getElement("#current-password"), {
      target: { value: "OldPassword1!" },
    })
    fireEvent.change(getElement("#new-password"), {
      target: { value: "Password123!" },
    })
    fireEvent.change(getElement("#confirm-password"), {
      target: { value: "Password123!" },
    })

    fireEvent.click(getElement('button[type="submit"]'))

    await waitFor(() => {
      expect(openVerificationDialogMock).toHaveBeenCalledTimes(1)
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/users/password",
        ChangePasswordSchema,
        {
          method: "PATCH",
          body: {
            oldPassword: "OldPassword1!",
            newPassword: "Password123!",
          },
        }
      )
      expect(toast.success).toHaveBeenCalledWith(expect.any(String))
    })
  })
})
