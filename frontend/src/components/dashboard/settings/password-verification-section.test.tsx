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
import { createPasswordChallenge, sendVerificationCode } from "./utils"

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

vi.mock("./utils", () => ({
  createPasswordChallenge: vi.fn(),
  sendVerificationCode: vi.fn(),
  formatCountdown: (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  },
}))

const mockCreatePasswordChallenge = vi.mocked(createPasswordChallenge)
const mockSendVerificationCode = vi.mocked(sendVerificationCode)

const RESEND_BUTTON_REGEX = /wyślij ponownie/i
const CODE_INPUT_REGEX = /kod 2fa/i
const VERIFY_BUTTON_REGEX = /zweryfikuj kod/i
const VERIFIED_TEXT_REGEX = /zweryfikowano/i
const SAFE_CHANGE_TEXT_REGEX = /możesz bezpiecznie zmienić hasło/i

function PasswordVerificationHarness({
  method,
  onVerify,
  autoVerify,
  isVerified,
}: {
  method: TwoFactorMethod
  onVerify: (code: string) => void
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
      onVerify={onVerify}
    />
  )
}

describe("PasswordVerificationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requests a verification code for email and starts the resend cooldown", async () => {
    mockCreatePasswordChallenge.mockResolvedValue({
      sessionId: "pwd-1",
      destination: "a***@magazynpro.pl",
    })
    mockSendVerificationCode.mockResolvedValue()

    render(<PasswordVerificationHarness method="EMAIL" onVerify={vi.fn()} />)

    await waitFor(() => {
      expect(mockCreatePasswordChallenge).toHaveBeenCalledWith("EMAIL")
    })
    await waitFor(() => {
      expect(mockSendVerificationCode).toHaveBeenCalledWith("pwd-1")
    })

    const resendButton = await screen.findByRole("button", {
      name: RESEND_BUTTON_REGEX,
    })

    expect(resendButton).toBeDisabled()
  })

  it("submits the code and renders verified state from the parent", async () => {
    const onVerify = vi.fn()

    const { rerender } = render(
      <PasswordVerificationHarness method="AUTHENTICATOR" onVerify={onVerify} />
    )

    const codeInput = await screen.findByLabelText(CODE_INPUT_REGEX)
    fireEvent.change(codeInput, {
      target: { value: "654321" },
    })

    fireEvent.click(screen.getByRole("button", { name: VERIFY_BUTTON_REGEX }))

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith("654321")
    })

    rerender(
      <PasswordVerificationHarness
        isVerified
        method="AUTHENTICATOR"
        onVerify={onVerify}
      />
    )

    const alert = await screen.findByRole("alert")
    expect(within(alert).getByText(VERIFIED_TEXT_REGEX)).toBeInTheDocument()
    expect(within(alert).getByText(SAFE_CHANGE_TEXT_REGEX)).toBeInTheDocument()
  })

  it("auto-submits when the last digit is entered", async () => {
    const onVerify = vi.fn()

    render(
      <PasswordVerificationHarness
        autoVerify
        method="AUTHENTICATOR"
        onVerify={onVerify}
      />
    )

    const codeInput = await screen.findByLabelText(CODE_INPUT_REGEX)
    fireEvent.change(codeInput, {
      target: { value: "123456" },
    })

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith("123456")
    })
  })
})
