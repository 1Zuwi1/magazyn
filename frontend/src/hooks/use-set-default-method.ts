import { apiFetch } from "@/lib/fetcher"
import { TFADefaultMethodSchema, type TwoFactorMethod } from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"

export default function useSetDefaultMethod() {
  return useApiMutation({
    mutationFn: (method: TwoFactorMethod) =>
      apiFetch("/api/2fa/default", TFADefaultMethodSchema, {
        method: "PATCH",
        body: { method },
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: ["linked-2fa-methods"] })
    },
  })
}
