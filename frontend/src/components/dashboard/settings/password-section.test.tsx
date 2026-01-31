import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, it, vi } from "vitest"
import { PasswordSection } from "./password-section"

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("./utils", () => ({
  wait: () => Promise.resolve(),
}))

vi.mock("./password-verification-section", () => ({
  PasswordVerificationSection: ({
    onVerificationChange,
  }: {
    onVerificationChange: (complete: boolean) => void
  }) => (
    <button onClick={() => onVerificationChange(true)} type="button">
      Zatwierdź weryfikację
    </button>
  ),
}))

const OLD_PASSWORD_REGEX = /obecne hasło/i
const NEW_PASSWORD_REGEX = /nowe hasło/i
const CONFIRM_PASSWORD_REGEX = /potwierdź hasło/i
const CHANGE_PASSWORD_BUTTON_REGEX = /zmień hasło/i
const TWO_FACTOR_ALERT_REGEX = /potwierdź 2fa przed zmianą/i
const CONFIRM_REGEX = /zatwierdź/i

describe("PasswordSection", () => {
  it("blocks submission until 2FA verification completes", async () => {
    render(<PasswordSection twoFactorMethod="EMAIL" verificationRequired />)

    fireEvent.change(screen.getByLabelText(OLD_PASSWORD_REGEX), {
      target: { value: "OldPassword1!" },
    })
    fireEvent.change(screen.getByLabelText(NEW_PASSWORD_REGEX), {
      target: { value: "Password123!" },
    })
    fireEvent.change(screen.getByLabelText(CONFIRM_PASSWORD_REGEX), {
      target: { value: "Password123!" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: CHANGE_PASSWORD_BUTTON_REGEX })
    )
    expect(await screen.findByText(TWO_FACTOR_ALERT_REGEX)).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: CONFIRM_REGEX }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Hasło zostało zmienione.")
    })
  })
})
