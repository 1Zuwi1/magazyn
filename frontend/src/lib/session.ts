// import { headers } from "next/headers"
// import { redirect } from "next/navigation"
import { cache } from "react"
import { ApiMeSchema } from "./schemas"
// import { apiFetch } from "./fetcher"
// import { ApiMeSchema } from "./schemas"

export const getSession = cache(async (_redirectTo?: string) => {
  return await ApiMeSchema.shape.GET.shape.output.parseAsync({
    id: 1,
    email: "example@example.com",
    username: "exampleUser",
    full_name: null,
    two_factor_enabled: false,
    role: "user",
  })

  // try {
  //   const res = await apiFetch("/api/auth/me", ApiMeSchema, {
  //     method: "GET",
  //     ...(typeof window === "undefined" ? { headers: await headers() } : {}),
  //   })

  //   return res
  // } catch {
  //   redirectTo && redirect(redirectTo)
  //   // Not logged in
  //   return null
  // }
})
