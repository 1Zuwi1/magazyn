import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

vi.mock("@tanstack/react-query", async () => {
  const mod = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  )
  return {
    ...mod,
    keepPreviousData: true,
  }
})

const PROTECTED_STATUS_REGEX = /chronione/i

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
    render(<SecuritySection userEmail="user@site.pl" />, {
      wrapper: createQueryClientWrapper(),
    })

    expect(screen.getByText(PROTECTED_STATUS_REGEX)).toBeInTheDocument()
    expect(screen.getByTestId("password-section")).toHaveTextContent("EMAIL")
  })
})
