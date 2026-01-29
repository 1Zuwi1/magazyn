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
    // if (process.env.NODE_ENV === "development") {
    //   return ApiMeSchema.shape.GET.shape.output.parse({
    //     id: 1,
    //     email: "dev@example.com",
    //     full_name: "Development User",
    //     two_factor_enabled: false,
    //     status: "verified",
    //     role: "admin",
    //   })
    // }
    if (redirectTo) {
      redirect(redirectTo)
    }
    // Not logged in
    return null
  }
})
