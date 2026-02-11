import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { apiFetch, FetchError } from "./fetcher"
import { ApiMeSchema } from "./schemas"

export const getSession = cache(async (redirectTo?: string) => {
  try {
    const res = await apiFetch("/api/users/me", ApiMeSchema, {
      method: "GET",
      ...(typeof window === "undefined" ? { headers: await headers() } : {}),
    })

    return res
  } catch (error) {
    if (
      FetchError.isError(error) &&
      error.message === "NOT_VERIFIED_BY_ADMIN"
    ) {
      redirect("/pending-verification")
    }
    if (redirectTo) {
      redirect(redirectTo)
    }
    // Not logged in
    return null
  }
})
