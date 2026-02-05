import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { apiFetch } from "./fetcher"
import { ApiMeSchema } from "./schemas"

export const getSession = cache(async (redirectTo?: string) => {
  if (process.env.NODE_ENV === "development") {
    return {
      id: 1,
      email: "email@example.com",
      full_name: "Admin user",
      role: "ADMIN",
      account_status: "ACTIVE",
    }
  }
  try {
    const res = await apiFetch("/api/users/me", ApiMeSchema, {
      method: "GET",
      ...(typeof window === "undefined" ? { headers: await headers() } : {}),
    })

    return res
  } catch {
    if (redirectTo) {
      redirect(redirectTo)
    }
    // Not logged in
    return null
  }
})
