"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type React from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 3,
    },
  },
})

export default function LayoutQueryClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
