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

const oldPasswordRegex = /obecne hasło/i
const newPasswordRegex = /nowe hasło/i
const confirmPasswordRegex = /potwierdź hasło/i
const changePasswordButtonRegex = /zmień hasło/i
const twoFactorAlertRegex = /potwierdź 2fa przed zmianą/i
const confirmRegex = /zatwierdź/i

describe("PasswordSection", () => {
  it("blocks submission until 2FA verification completes", async () => {
    render(<PasswordSection twoFactorMethod="email" verificationRequired />)

    fireEvent.change(screen.getByLabelText(oldPasswordRegex), {
      target: { value: "OldPassword1!" },
    })
    fireEvent.change(screen.getByLabelText(newPasswordRegex), {
      target: { value: "Password123!" },
    })
    fireEvent.change(screen.getByLabelText(confirmPasswordRegex), {
      target: { value: "Password123!" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: changePasswordButtonRegex })
    )
    expect(await screen.findByText(twoFactorAlertRegex)).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: confirmRegex }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Hasło zostało zmienione.")
    })
  })
})
