"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { TwoFactorVerificationDialogRoot } from "@/components/dashboard/settings/two-factor-verification-dialog-root"

export default function LayoutQueryClientWrapper({
  children,
}: {
  children: ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 3,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <TwoFactorVerificationDialogRoot />
    </QueryClientProvider>
  )
}
