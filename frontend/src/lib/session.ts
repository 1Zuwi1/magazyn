import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { apiFetch } from "./fetcher"
import { ApiMeSchema } from "./schemas"

export const getSession = cache(async (redirectTo?: string) => {
  try {
    const res = await apiFetch("/api/auth/me", ApiMeSchema, {
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
