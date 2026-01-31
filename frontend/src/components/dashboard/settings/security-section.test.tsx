import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { TwoFactorMethod } from "@/lib/schemas"
import { SecuritySection } from "./security-section"
import type { TwoFactorStatus } from "./types"

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
    status,
  }: {
    method: TwoFactorMethod
    onMethodChange: (method: TwoFactorMethod) => void
    status: TwoFactorStatus
  }) => (
    <div>
      <div data-testid="twofactor-status">{status}</div>
      <button onClick={() => onMethodChange("SMS")} type="button">
        Switch to SMS
      </button>
      <span>Method: {method}</span>
    </div>
  ),
}))

const PROTECTED_STATUS_REGEX = /chronione/i
const SWITCH_SMS_REGEX = /switch to sms/i

describe("SecuritySection", () => {
  it("keeps 2FA enabled by default and updates method", () => {
    render(<SecuritySection userEmail="user@site.pl" />)

    expect(screen.getByText(PROTECTED_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByTestId("password-section")).toHaveTextContent(
      "required-EMAIL"
    )

    fireEvent.click(screen.getByRole("button", { name: SWITCH_SMS_REGEX }))

    expect(screen.getByTestId("password-section")).toHaveTextContent(
      "required-SMS"
    )
  })
})
