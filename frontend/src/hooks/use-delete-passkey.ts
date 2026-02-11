import { apiFetch } from "@/lib/fetcher"
import { PasskeyDeleteSchema } from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { PASSKEYS_QUERY_KEY } from "./use-passkeys"

export default function useDeletePasskey() {
  return useApiMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/2fa/passkeys/${id}`, PasskeyDeleteSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
    },
  })
}
