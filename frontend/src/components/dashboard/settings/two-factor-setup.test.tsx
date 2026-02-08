import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TwoFactorMethod } from "@/lib/schemas"
import { RECOVERY_CODES } from "./constants"
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorStatus } from "./types"

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

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

const START_SETUP_REGEX = /rozpocznij konfigurację/i
const ADD_METHOD_REGEX = /dodaj metodę/i
const ACTIVE_STATUS_REGEX = /aktywna/i
const SHOW_CODES_REGEX = /pokaż/i
const RECOVERY_CODES_REGEX = /kody odzyskiwania/i

function TwoFactorSetupHarness({
  initialStatus = "ENABLED",
  initialMethod = "AUTHENTICATOR",
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
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    mockUseQuery.mockReturnValue({
      data: {
        defaultMethod: "EMAIL",
        methods: ["EMAIL"],
      },
      isLoading: false,
      refetch: vi.fn(),
    })
  })

  it("renders enabled state by default", () => {
    render(<TwoFactorSetupHarness />)

    expect(screen.getByText(ACTIVE_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: ADD_METHOD_REGEX })).toBeEnabled()
  })

  it("shows start action when 2FA is disabled", () => {
    render(<TwoFactorSetupHarness initialStatus="DISABLED" />)

    expect(
      screen.getByRole("button", { name: START_SETUP_REGEX })
    ).toBeInTheDocument()
  })

  it("reveals recovery codes when enabled", () => {
    render(<TwoFactorSetupHarness initialStatus="ENABLED" />)

    fireEvent.click(screen.getByRole("button", { name: SHOW_CODES_REGEX }))

    expect(screen.getByLabelText(RECOVERY_CODES_REGEX)).toHaveValue(
      RECOVERY_CODES.join("\n")
    )
  })
})
