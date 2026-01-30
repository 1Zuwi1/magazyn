import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { useState } from "react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PasswordVerificationSection } from "./password-verification-section"
import type { TwoFactorMethod } from "./types"
import {
  createPasswordChallenge,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

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
  verifyOneTimeCode: vi.fn(),
  formatCountdown: (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  },
}))

const mockCreatePasswordChallenge = vi.mocked(createPasswordChallenge)
const mockSendVerificationCode = vi.mocked(sendVerificationCode)
const mockVerifyOneTimeCode = vi.mocked(verifyOneTimeCode)

const RESEND_BUTTON_REGEX = /wyślij ponownie/i
const CODE_INPUT_REGEX = /kod 2fa/i
const VERIFY_BUTTON_REGEX = /zweryfikuj kod/i
const VERIFIED_TEXT_REGEX = /zweryfikowano/i
const SAFE_CHANGE_TEXT_REGEX = /możesz bezpiecznie zmienić hasło/i

function PasswordVerificationHarness({
  method,
  onVerificationChange,
}: {
  method: TwoFactorMethod
  onVerificationChange: (complete: boolean) => void
}) {
  const [code, setCode] = useState<string>("")

  return (
    <PasswordVerificationSection
      code={code}
      method={method}
      onInputChange={setCode}
      onVerificationChange={onVerificationChange}
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

    render(
      <PasswordVerificationHarness
        method="email"
        onVerificationChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(mockCreatePasswordChallenge).toHaveBeenCalledWith("email")
    })
    await waitFor(() => {
      expect(mockSendVerificationCode).toHaveBeenCalledWith("pwd-1")
    })

    const resendButton = await screen.findByRole("button", {
      name: RESEND_BUTTON_REGEX,
    })

    expect(resendButton).toBeDisabled()
  })

  it("verifies authenticator codes and signals completion", async () => {
    mockVerifyOneTimeCode.mockResolvedValue(true)
    const onVerificationChange = vi.fn()

    render(
      <PasswordVerificationHarness
        method="authenticator"
        onVerificationChange={onVerificationChange}
      />
    )

    const codeInput = await screen.findByLabelText(CODE_INPUT_REGEX)
    fireEvent.change(codeInput, {
      target: { value: "654321" },
    })

    fireEvent.click(screen.getByRole("button", { name: VERIFY_BUTTON_REGEX }))

    await waitFor(() => {
      expect(mockVerifyOneTimeCode).toHaveBeenCalledWith("654321")
    })

    await waitFor(() => {
      expect(onVerificationChange).toHaveBeenLastCalledWith(true)
    })

    const alert = await screen.findByRole("alert")
    expect(within(alert).getByText(VERIFIED_TEXT_REGEX)).toBeInTheDocument()
    expect(within(alert).getByText(SAFE_CHANGE_TEXT_REGEX)).toBeInTheDocument()
  })

  it("shows an error when the verification code is invalid", async () => {
    const onVerificationChange = vi.fn()
    mockVerifyOneTimeCode.mockResolvedValue(false)

    render(
      <PasswordVerificationHarness
        method="authenticator"
        onVerificationChange={onVerificationChange}
      />
    )

    const codeInput = await screen.findByLabelText(CODE_INPUT_REGEX)
    fireEvent.change(codeInput, {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button", { name: VERIFY_BUTTON_REGEX }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Kod jest nieprawidłowy. Spróbuj ponownie."
      )
    })
  })
})
