import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SecuritySection } from "./security-section"
import type { TwoFactorMethod, TwoFactorStatus } from "./types"

vi.mock("./password-section", () => ({
  PasswordSection: ({
    twoFactorMethod,
    verificationRequired,
  }: {
    twoFactorMethod: TwoFactorMethod
    verificationRequired: boolean
  }) => (
    <div data-testid="password-section">
      {verificationRequired ? "required" : "optional"}-{twoFactorMethod}
    </div>
  ),
}))

vi.mock("./two-factor-setup", () => ({
  TwoFactorSetup: ({
    method,
    onMethodChange,
    onStatusChange,
    status,
  }: {
    method: TwoFactorMethod
    onMethodChange: (method: TwoFactorMethod) => void
    onStatusChange: (status: TwoFactorStatus) => void
    status: TwoFactorStatus
  }) => (
    <div>
      <div data-testid="twofactor-status">{status}</div>
      <button onClick={() => onStatusChange("ENABLED")} type="button">
        Enable
      </button>
      <button onClick={() => onMethodChange("EMAIL")} type="button">
        Switch to email
      </button>
      <span>Method: {method}</span>
    </div>
  ),
}))

const BASIC_STATUS_REGEX = /podstawowe/i
const ENABLE_BUTTON_REGEX = /enable/i
const PROTECTED_STATUS_REGEX = /chronione/i
const SWITCH_EMAIL_REGEX = /switch to email/i

describe("SecuritySection", () => {
  it("updates password verification requirement when 2FA is enabled", () => {
    render(<SecuritySection userEmail="user@site.pl" />)

    expect(screen.getByText(BASIC_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByTestId("password-section")).toHaveTextContent(
      "optional-AUTHENTICATOR"
    )

    fireEvent.click(screen.getByRole("button", { name: ENABLE_BUTTON_REGEX }))

    expect(screen.getByText(PROTECTED_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByTestId("password-section")).toHaveTextContent(
      "required-AUTHENTICATOR"
    )

    fireEvent.click(screen.getByRole("button", { name: SWITCH_EMAIL_REGEX }))

    expect(screen.getByTestId("password-section")).toHaveTextContent(
      "required-EMAIL"
    )
  })
})
