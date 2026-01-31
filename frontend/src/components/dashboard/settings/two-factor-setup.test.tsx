import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RECOVERY_CODES } from "./constants"
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorMethod, TwoFactorStatus } from "./types"
import {
  createTwoFactorChallenge,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

vi.mock("next-intl", () => ({
  useLocale: () => "pl",
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@hugeicons/react", () => ({
  HugeiconsIcon: () => <span data-testid="hugeicons-icon" />,
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

vi.mock("./qr-code", () => ({
  QRCodeDisplay: () => <div data-testid="qr-code" />,
  generateTotpUri: () => "otpauth://totp/test",
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
  createTwoFactorChallenge: vi.fn(),
  sendVerificationCode: vi.fn(),
  verifyOneTimeCode: vi.fn(),
  formatCountdown: (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  },
}))

const mockCreateTwoFactorChallenge = vi.mocked(createTwoFactorChallenge)
const mockSendVerificationCode = vi.mocked(sendVerificationCode)
const mockVerifyOneTimeCode = vi.mocked(verifyOneTimeCode)

const START_SETUP_REGEX = /rozpocznij konfigurację/i
const CODE_LABEL_REGEX = /kod weryfikacyjny/i
const VERIFY_BUTTON_REGEX = /zweryfikuj i aktywuj/i
const ACTIVE_STATUS_REGEX = /2fa aktywna/i
const ENABLED_NOTE_REGEX = /weryfikacja dwuetapowa została włączona/i
const SETUP_ERROR_REGEX = /nie udało się aktywować 2fa/i
const SHOW_CODES_REGEX = /pokaż/i
const RECOVERY_CODES_REGEX = /kody odzyskiwania/i

function TwoFactorSetupHarness({
  initialStatus = "ENABLED",
  initialMethod = "SMS",
}: {
  initialStatus?: TwoFactorStatus
  initialMethod?: TwoFactorMethod
}) {
  const [status] = useState<TwoFactorStatus>(initialStatus)
  const [method, setMethod] = useState<TwoFactorMethod>(initialMethod)

  return (
    <TwoFactorSetup
      method={method}
      onMethodChange={setMethod}
      status={status}
      userEmail="test@example.com"
    />
  )
}

describe("TwoFactorSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts setup and enables 2FA after valid verification", async () => {
    mockCreateTwoFactorChallenge.mockResolvedValue({
      sessionId: "session-1",
      secret: "SECRET",
      destination: "+48 *** *** 203",
      issuedAt: "10:10",
    })
    mockSendVerificationCode.mockResolvedValue()
    mockVerifyOneTimeCode.mockResolvedValue(true)

    render(<TwoFactorSetupHarness />)

    fireEvent.click(screen.getByRole("button", { name: START_SETUP_REGEX }))

    await waitFor(() => {
      expect(mockCreateTwoFactorChallenge).toHaveBeenCalledWith("SMS", "pl")
    })
    await waitFor(() => {
      expect(mockSendVerificationCode).toHaveBeenCalledWith("session-1")
    })

    const codeInput = await screen.findByLabelText(CODE_LABEL_REGEX)
    fireEvent.change(codeInput, {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button", { name: VERIFY_BUTTON_REGEX }))

    await waitFor(() => {
      expect(mockVerifyOneTimeCode).toHaveBeenCalledWith("123456")
    })

    expect(await screen.findByText(ACTIVE_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByText(ENABLED_NOTE_REGEX)).toBeInTheDocument()
  })

  it("shows an error when setup initialization fails", async () => {
    mockCreateTwoFactorChallenge.mockRejectedValue(new Error("boom"))

    render(<TwoFactorSetupHarness />)

    fireEvent.click(screen.getByRole("button", { name: START_SETUP_REGEX }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Nie udało się zainicjować konfiguracji. Spróbuj ponownie."
      )
    })

    expect(screen.getByText(SETUP_ERROR_REGEX)).toBeInTheDocument()
  })

  it("reveals recovery codes when enabled", () => {
    render(<TwoFactorSetupHarness initialStatus="ENABLED" />)

    fireEvent.click(screen.getByRole("button", { name: SHOW_CODES_REGEX }))

    expect(screen.getByLabelText(RECOVERY_CODES_REGEX)).toHaveValue(
      RECOVERY_CODES.join("\n")
    )
  })
})
