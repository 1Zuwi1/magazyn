import { cache } from "react"
import { apiFetch } from "./fetcher"
import { ApiMeSchema } from "./schemas"

export const getSession = cache(async () => {
  try {
    const res = await apiFetch("/auth/me", ApiMeSchema, {
      method: "GET",
    })

    return res
  } catch {
    return null
  }
})
