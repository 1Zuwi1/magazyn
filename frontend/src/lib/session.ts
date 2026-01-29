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
    if (process.env.NODE_ENV === "development") {
      // TODO: Delete when backend is ready
      // Development stub
      return await ApiMeSchema.shape.GET.shape.output.parseAsync({
        id: 1,
        email: "user@example.com",
        username: "user123",
        full_name: "User Example",
        two_factor_enabled: false,
        role: "admin",
        status: "verified",
      })
    }

    if (redirectTo) {
      redirect(redirectTo)
    }
    // Not logged in
    return null
  }
})
