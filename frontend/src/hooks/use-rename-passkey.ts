import { apiFetch } from "@/lib/fetcher"
import { PasskeyRenameSchema } from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { PASSKEYS_QUERY_KEY } from "./use-passkeys"

interface RenamePasskeyVariables {
  id: number
  name: string
}

export default function useRenamePasskey() {
  return useApiMutation({
    mutationFn: ({ id, name }: RenamePasskeyVariables) =>
      apiFetch(`/api/2fa/passkeys/${id}/rename`, PasskeyRenameSchema, {
        method: "PUT",
        body: { name },
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
    },
  })
}
