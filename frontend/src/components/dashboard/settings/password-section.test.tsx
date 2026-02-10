import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, it, vi } from "vitest"
import { translateMessage } from "@/i18n/translate-message"
import { ChangePasswordSchema } from "@/lib/schemas"
import { PasswordSection } from "./password-section"

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

const OLD_PASSWORD_LABEL = translateMessage("generated.m0551")
const NEW_PASSWORD_LABEL = translateMessage("generated.m0055")
const CONFIRM_PASSWORD_LABEL = translateMessage("generated.m0013")
const CHANGE_PASSWORD_BUTTON_LABEL = translateMessage("generated.m0556")

describe("PasswordSection", () => {
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

    fireEvent.change(screen.getByLabelText(OLD_PASSWORD_LABEL), {
      target: { value: "OldPassword1!" },
    })
    fireEvent.change(screen.getByLabelText(NEW_PASSWORD_LABEL), {
      target: { value: "Password123!" },
    })
    fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_LABEL), {
      target: { value: "Password123!" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: CHANGE_PASSWORD_BUTTON_LABEL })
    )

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
      expect(toast.success).toHaveBeenCalledWith(
        translateMessage("generated.m0550")
      )
    })
  })
})
