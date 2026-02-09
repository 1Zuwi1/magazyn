import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/lib/fetcher"
import { BackupCodesGenerateSchema, type TwoFactorMethod } from "@/lib/schemas"
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorStatus } from "./types"

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  keepPreviousData: true,
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

vi.mock("@/lib/fetcher", () => ({
  apiFetch: vi.fn(),
  FetchError: class FetchError extends Error {
    static isError(error: unknown) {
      return error instanceof Error
    }
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
const GENERATE_CODES_REGEX = /wygeneruj/i
const RECOVERY_CODES_REGEX = /kody odzyskiwania/i
const GENERATE_NEW_CODES_REGEX = /wygeneruj nowe kody/i
const PRINT_CODES_REGEX = /drukuj kody/i

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
  const apiFetchMock = vi.mocked(apiFetch)

  beforeEach(() => {
    apiFetchMock.mockReset()
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

  it("generates and shows recovery codes after confirmation", async () => {
    apiFetchMock.mockResolvedValue(["A1B2-C3D4", "E5F6-G7H8"])
    render(<TwoFactorSetupHarness initialStatus="ENABLED" />)

    fireEvent.click(screen.getByRole("button", { name: GENERATE_CODES_REGEX }))
    fireEvent.click(
      screen.getByRole("button", { name: GENERATE_NEW_CODES_REGEX })
    )

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/2fa/backup-codes/generate",
        BackupCodesGenerateSchema,
        {
          method: "POST",
          body: null,
        }
      )
    })

    expect(
      screen.getByRole("textbox", { name: RECOVERY_CODES_REGEX })
    ).toHaveValue("A1B2-C3D4\nE5F6-G7H8")
    expect(
      screen.getByRole("button", { name: PRINT_CODES_REGEX })
    ).toBeInTheDocument()
  })
})
