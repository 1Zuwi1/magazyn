import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SecuritySection } from "./security-section"

vi.mock("@/i18n/use-translations", () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock("./password-section", () => ({
  PasswordSection: () => <div data-testid="password-section" />,
}))

vi.mock("./two-factor-setup", () => ({
  TwoFactorSetup: () => <div data-testid="two-factor-setup" />,
}))

vi.mock("./passkeys-section", () => ({
  PasskeysSection: () => <div data-testid="passkeys-section" />,
}))

vi.mock("@tanstack/react-query", async () => {
  const mod = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  )
  return {
    ...mod,
    keepPreviousData: true,
  }
})

function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("SecuritySection", () => {
  it("keeps 2FA enabled by default and updates method", () => {
    render(
      <SecuritySection
        backupCodesRefreshNeeded={false}
        userEmail="user@site.pl"
      />,
      {
        wrapper: createQueryClientWrapper(),
      }
    )

    expect(screen.getByTestId("password-section")).toBeInTheDocument()
    expect(screen.getByTestId("two-factor-setup")).toBeInTheDocument()
    expect(screen.getByTestId("passkeys-section")).toBeInTheDocument()
  })
})
