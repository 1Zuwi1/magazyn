import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { TwoFactorMethod } from "@/lib/schemas"
import { SecuritySection } from "./security-section"

vi.mock("./password-section", () => ({
  PasswordSection: ({
    twoFactorMethod,
  }: {
    twoFactorMethod: TwoFactorMethod
  }) => <div data-testid="password-section">{twoFactorMethod}</div>,
}))

const PROTECTED_STATUS_REGEX = /chronione/i

describe("SecuritySection", () => {
  it("keeps 2FA enabled by default and updates method", () => {
    render(<SecuritySection userEmail="user@site.pl" />)

    expect(screen.getByText(PROTECTED_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByTestId("password-section")).toHaveTextContent("EMAIL")
  })
})
