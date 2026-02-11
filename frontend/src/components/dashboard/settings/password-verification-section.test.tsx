import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TwoFactorMethod } from "@/lib/schemas"
import { PasswordVerificationSection } from "./password-verification-section"

const NON_EMPTY_TEXT_REGEX = /.+/

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("./otp-input", () => ({
  OtpInput: ({
    id,
    onChange,
    value,
    disabled,
  }: {
    id: string
    onChange: (value: string) => void
    value: string
    disabled?: boolean
  }) => (
    <input
      disabled={disabled}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  ),
}))

vi.mock("./use-countdown", async () => {
  const React = await import("react")
  return {
    useCountdown: (initialSeconds: number) => {
      const [seconds, setSeconds] = React.useState<number>(initialSeconds)
      const startTimer = React.useCallback((nextSeconds?: number) => {
        setSeconds(nextSeconds ?? 0)
      }, [])
      return [seconds, startTimer] as const
    },
  }
})

function PasswordVerificationHarness({
  method,
  onVerify,
  onRequestCode,
  autoVerify,
  isVerified,
}: {
  method: TwoFactorMethod
  onVerify: (code: string) => void
  onRequestCode: (method: TwoFactorMethod) => Promise<void>
  autoVerify?: boolean
  isVerified?: boolean
}) {
  const [code, setCode] = useState<string>("")

  return (
    <PasswordVerificationSection
      autoVerify={autoVerify}
      code={code}
      isVerified={isVerified}
      method={method}
      onInputChange={setCode}
      onRequestCode={onRequestCode}
      onVerify={onVerify}
    />
  )
}

describe("PasswordVerificationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requests a verification code for email and starts the resend cooldown", async () => {
    const onRequestCode = vi.fn().mockResolvedValue(undefined)

    render(
      <PasswordVerificationHarness
        method="EMAIL"
        onRequestCode={onRequestCode}
        onVerify={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(onRequestCode).toHaveBeenCalledWith("EMAIL")
    })

    const resendButton = await waitFor(() => {
      const button = screen
        .getAllByRole("button")
        .find((candidate) => candidate.getAttribute("aria-describedby"))
      if (!button) {
        throw new Error("Resend button not found")
      }
      return button
    })

    expect(resendButton).toBeDisabled()
  })

  it("submits the code and renders verified state from the parent", async () => {
    const onVerify = vi.fn()

    const { rerender } = render(
      <PasswordVerificationHarness
        method="AUTHENTICATOR"
        onRequestCode={vi.fn().mockResolvedValue(undefined)}
        onVerify={onVerify}
      />
    )

    const codeInput = document.querySelector("#password-2fa-code")
    if (!(codeInput instanceof HTMLInputElement)) {
      throw new Error("Code input not found")
    }
    fireEvent.change(codeInput, {
      target: { value: "654321" },
    })

    fireEvent.click(screen.getAllByRole("button")[0])

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith("654321")
    })

    rerender(
      <PasswordVerificationHarness
        isVerified
        method="AUTHENTICATOR"
        onRequestCode={vi.fn().mockResolvedValue(undefined)}
        onVerify={onVerify}
      />
    )

    const alert = await screen.findByRole("alert")
    expect(
      within(alert).getAllByText(NON_EMPTY_TEXT_REGEX).length
    ).toBeGreaterThan(1)
  })

  it("auto-submits when the last digit is entered", async () => {
    const onVerify = vi.fn()

    render(
      <PasswordVerificationHarness
        autoVerify
        method="AUTHENTICATOR"
        onRequestCode={vi.fn().mockResolvedValue(undefined)}
        onVerify={onVerify}
      />
    )

    const codeInput = document.querySelector("#password-2fa-code")
    if (!(codeInput instanceof HTMLInputElement)) {
      throw new Error("Code input not found")
    }
    fireEvent.change(codeInput, {
      target: { value: "123456" },
    })

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith("123456")
    })
  })
})
