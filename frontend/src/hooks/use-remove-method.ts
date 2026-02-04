import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { TFARemoveMethodSchema, type TwoFactorMethod } from "@/lib/schemas"

export default function useRemoveMethod() {
  return useMutation({
    mutationFn: (method: TwoFactorMethod) =>
      apiFetch("/api/2fa/methods", TFARemoveMethodSchema, {
        method: "DELETE",
        body: { method },
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: ["linked-2fa-methods"] })
    },
  })
}
