import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { TFADefaultMethodSchema, type TwoFactorMethod } from "@/lib/schemas"

export default function useSetDefaultMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (method: TwoFactorMethod) =>
      apiFetch("/api/2fa/default", TFADefaultMethodSchema, {
        method: "PATCH",
        body: { method },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-2fa-methods"] })
    },
  })
}
